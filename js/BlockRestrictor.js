const { data } = window.wp
const { select, dispatch, subscribe } = data
const { getEditedPostAttribute } = select('core/editor')
const { isTyping } = select('core/block-editor')
const { getBlockType } = select('core/blocks')
const { addBlockTypes, removeBlockTypes } = dispatch('core/blocks')

class BlockRestrictor {
    /**
     * Currently selected template.
     * @type {string}
     */
    currentTemplate = ''

    /**
     * Map block names to the actual block object.
     *
     * @type {object}
     */
    unregisteredBlocks = {}

    constructor(blockTemplateRestrictions) {
        this.blockTemplateRestrictions = blockTemplateRestrictions
    }

    /**
     * Initiates listening to the redux store for when a restricted block is either
     * added or removed.
     */
    run() {
        this.currentTemplate = getEditedPostAttribute('template') || 'default'

        this.restrictBlocksToTemplate()

        /**
         * subscribe fires whenever the redux store in gutenberg updates
         */
        subscribe(() => {
            /**
             * ensure we don't run our logic when the user is typing.
             */
            if (isTyping() === true) {
                return false
            }

            const newTemplate = getEditedPostAttribute('template') || 'default'

            if (this.currentTemplate !== newTemplate) {
                this.currentTemplate = newTemplate
                this.restrictBlocksToTemplate()
            }
        })
    }

    /**
     * Helps decide which blocks we actually want to add or remove from
     * the store.
     */
    templateBlockRegistry() {
        let blocksToAdd = []
        let blocksToRemove = []

        Object.keys(this.blockTemplateRestrictions).forEach((blockName) => {
            if (this.blockTemplateRestrictions[blockName].includes(this.currentTemplate)) {
                blocksToAdd.push(blockName)
            } else {
                blocksToRemove.push(blockName)
            }
        })

        return {
            blocksToAdd,
            blocksToRemove,
        }
    }

    /**
     * Either removes or adds blocks to the store based on what the current
     * template is.
     */
    restrictBlocksToTemplate() {
        const { blocksToAdd, blocksToRemove } = this.templateBlockRegistry()

        if (blocksToRemove.length) {
            blocksToRemove.forEach((blockName) => {
                const blockExists = getBlockType(blockName)
                const isRegistered = typeof this.unregisteredBlocks[blockName] === 'undefined'
                if (blockExists && isRegistered) {
                    this.unregisteredBlocks[blockName] = getBlockType(blockName)
                }
            })
            removeBlockTypes(Object.keys(this.unregisteredBlocks))
        }

        if (blocksToAdd.length) {
            let registeredBlocks = []
            blocksToAdd.forEach(blockName => {
                const blockExists = typeof getBlockType(blockName) === 'undefined'
                const isUnregistered = typeof this.unregisteredBlocks[blockName] !== 'undefined'

                if (blockExists && isUnregistered) {
                    registeredBlocks.push(this.unregisteredBlocks[blockName])
                    delete this.unregisteredBlocks[blockName]
                }
            })
            addBlockTypes(registeredBlocks)
        }
    }

}

export default BlockRestrictor
