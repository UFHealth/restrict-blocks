import pick from 'lodash/pick'
import intersection from 'lodash/intersection'

const { data, i18n } = window.wp
const { __ } = i18n
const { select, dispatch, subscribe } = data
const { isTyping, getBlocks } = select('core/block-editor')
const { getBlockType } = select('core/blocks')
const { updateEditorSettings } = dispatch('core/editor')
const { isEditorPanelOpened, getActiveGeneralSidebarName } = select('core/edit-post')

/**
 * Our whitelist notice that we inject under the Page Templates select box.
 */
const templateWhitelistNotice = document.createElement('p')
const templateWhitelistBlockList = document.createElement('ul')

templateWhitelistNotice.classList.add('components-base-control__note')
templateWhitelistBlockList.classList.add('components-base-control__note')
templateWhitelistNotice.innerText = __('Some page templates are currently unavailable because they are incompatible with the following blocks on this page. You will need to remove them in order to make those templates available again.', 'ufhealth-restrict-blocks')

class TemplateWhitelister {
    /**
     * Defines the map of block types and the templates they are restricted to.
     *
     * @type {object}
     */
    blockTemplateRestrictions = {}

    /**
     * Restricted Blocks currently in the editor
     *
     * @type {array}
     */
    currentRestrictedBlocks = []

    /**
     * Page Templates loaded with the page.
     *
     * @type {object}
     */
    defaultPageTemplates = {}

    /**
     * Are we currently restricting page templates? Determines
     * if we show the notice under the select box or not.
     *
     * @type {boolean}
     */
    isRestricted = false

    constructor(restrictedBlocks) {
        this.defaultPageTemplates = select('core/editor').getEditorSettings().availableTemplates
        this.blockTemplateRestrictions = restrictedBlocks
    }

    /**
     * Initiates watching the redux store for a template change.
     */
    run () {
        const blocks = getBlocks()
        const { templates, restrictedBlocks } = this.checkForRestrictedBlocks(blocks)
        this.currentRestrictedBlocks = restrictedBlocks

        this.updateWhitelistedTemplates(templates)
        this.addOrRemoveWhitelistNotice(restrictedBlocks)

        subscribe(() => {
            if (isTyping() === true) {
                return false
            }

            const blocks = getBlocks()
            const { templates, restrictedBlocks } = this.checkForRestrictedBlocks(blocks)

            this.addOrRemoveWhitelistNotice(restrictedBlocks)

            if (restrictedBlocks.length !== this.currentRestrictedBlocks.length) {
                this.currentRestrictedBlocks = restrictedBlocks
                this.updateWhitelistedTemplates(templates)
            }
        })
    }

    /**
     * Recursively checks the editor to see if there are any blocks that are restricted to
     * specific templates.
     *
     * @param {array} blocks
     * @return {object}
     */
    checkForRestrictedBlocks(blocks) {
        let foundTemplates = []
        let foundBlocks = []

        blocks.forEach(block => {
            if (typeof this.blockTemplateRestrictions[block.name] !== 'undefined') {
                foundTemplates.push(this.blockTemplateRestrictions[block.name])
                if (!foundBlocks.includes(block.name)) {
                    foundBlocks.push(block.name)
                }
            }

            if (block.innerBlocks.length > 0) {
                const { templates, restrictedBlocks } = this.checkForRestrictedBlocks(block.innerBlocks)

                if (templates.length > 0) {
                    foundTemplates.push(templates)
                }

                restrictedBlocks.forEach(blockName => {
                    if (!foundBlocks.includes(blockName)) {
                        foundBlocks.push(blockName)
                    }
                })
            }
        })

        return {
            templates: intersection(...foundTemplates),
            restrictedBlocks: foundBlocks,
        }
    }

    /**
     * Updates the available templates in the editor. Ensures editors can only select
     * templates that allow blocks currently being used.
     *
     * @param {array} templates
     */
    updateWhitelistedTemplates (templates) {
        if (templates.length > 0) {
            this.isRestricted = true
            updateEditorSettings({ availableTemplates: pick(this.defaultPageTemplates, templates) })
        } else {
            this.isRestricted = false
            updateEditorSettings({ availableTemplates: this.defaultPageTemplates })
        }
    }

    /**
     * Adds the whitelist notice under the Page Templates select box to let
     * users know why they only see certain templates.
     */
    addOrRemoveWhitelistNotice (restrictedBlocks) {
        if (isEditorPanelOpened('page-attributes') && getActiveGeneralSidebarName() === 'edit-post/document') {
            if (this.isRestricted) {
                this.addTemplateWhitelistNotice(restrictedBlocks)
            } else {
                this.removeTemplateWhitelistNotice()
            }
        }
    }

    /**
     * Add a note below the page template dropdown to inform the user of active template restrictions.
     */
    addTemplateWhitelistNotice (restrictedBlocks) {
        setTimeout(() => {
            const wrapper = document.querySelector('.editor-page-attributes__template')

            templateWhitelistBlockList.innerHTML = ''

            if (restrictedBlocks.length) {
                restrictedBlocks.forEach(blockName => {
                    const block = getBlockType(blockName)
                    const item = document.createElement('li')
                    item.innerText = `${block.title} Block`
                    templateWhitelistBlockList.appendChild(item)
                })
            }

            if (wrapper && wrapper.lastElementChild !== templateWhitelistNotice) {
                wrapper.appendChild(templateWhitelistNotice)
                wrapper.appendChild(templateWhitelistBlockList)
            }
        }, 50)
    }

    /**
     * Removes the notice from under the Page Templates select box.
     */
    removeTemplateWhitelistNotice () {
        setTimeout(() => {
            const wrapper = document.querySelector('.editor-page-attributes__template')
            if (wrapper && wrapper.contains(templateWhitelistNotice)) {
                templateWhitelistNotice.remove()
            }
        }, 50)
    }
}

export default TemplateWhitelister
