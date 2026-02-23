import kleur from 'kleur';

const OFFICIAL_PLUGINS = [
    {
        name: '@ringai/plugin-babel',
        description: 'Babel transpilation for tests',
        status: 'official',
    },
    {
        name: '@ringai/plugin-fs-store',
        description: 'Filesystem storage plugin',
        status: 'official',
    },
    {
        name: '@ringai/plugin-playwright-driver',
        description: 'Playwright browser driver',
        status: 'official',
    },
];

const COMMUNITY_PLUGINS = [
    {
        name: 'ringai-plugin-allure',
        description: 'Allure reporter integration',
        status: 'community',
    },
    {
        name: 'ringai-plugin-jest',
        description: 'Jest compatibility layer',
        status: 'community',
    },
];

export async function runPluginListCommand() {
    console.log(kleur.yellow().bold('Ringai Plugins\n'));
    console.log(kleur.dim('Official Plugins:\n'));

    for (const plugin of OFFICIAL_PLUGINS) {
        const statusIcon = plugin.status === 'official' ? kleur.green('✓') : kleur.yellow('⚠');
        console.log(`  ${statusIcon} ${plugin.name}`);
        console.log(kleur.dim(`      ${plugin.description}`));
        if (plugin.status === 'deprecated') {
            console.log(kleur.yellow('      [DEPRECATED]'));
        }
        console.log();
    }

    console.log(kleur.dim('Community Plugins:\n'));

    for (const plugin of COMMUNITY_PLUGINS) {
        console.log(`  ○ ${plugin.name}`);
        console.log(kleur.dim(`      ${plugin.description}`));
        console.log();
    }

    console.log(kleur.dim('To install a plugin:'));
    console.log(kleur.dim('  pnpm add @ringai/plugin-babel'));
    console.log();
}
