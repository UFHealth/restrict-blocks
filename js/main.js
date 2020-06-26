import BlockRestrictor from './BlockRestrictor'
import TemplateWhitelister from './TemplateWhitelister'

/*
 * Add a mapping of block names and what templates they are
 * restricted to.
 */
const blockTemplateRestrictions = {
    'core/code': [
        'template-super-cool.php',
    ],
}

wp.domReady(() => {
    const restrictor = new BlockRestrictor(blockTemplateRestrictions)
    const templateWhitelister = new TemplateWhitelister(blockTemplateRestrictions)

    restrictor.run()
    templateWhitelister.run()
})
