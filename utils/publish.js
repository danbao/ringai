const path = require('path');
const fs = require('fs');
const {npmPublish} = require('@jsdevtools/npm-publish');

const token = process.env.NPM_TOKEN;

const argv = process.argv.slice(2);
let excludeList = [];
let isDevPublish = false;
let githubUsername = '';
let commitId = '';
let isDryRun = false;

for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--exclude=')) {
        excludeList = argv[i].replace('--exclude=', '').split(',').map(s => s.trim());
    } else if (argv[i].startsWith('--dev')) {
        isDevPublish = true;
    } else if (argv[i].startsWith('--github-username=')) {
        githubUsername = argv[i].replace('--github-username=', '');
    } else if (argv[i].startsWith('--commit-id=')) {
        commitId = argv[i].replace('--commit-id=', '');
    } else if (argv[i].startsWith('--dry-run')) {
        isDryRun = true;
    }
}

if (!token && !isDryRun) {
    throw new Error('NPM_TOKEN required');
}

function getWorkspacePackages() {
    const rootDir = path.resolve(__dirname, '..');
    const workspaceYaml = fs.readFileSync(path.join(rootDir, 'pnpm-workspace.yaml'), 'utf8');
    const patterns = [...workspaceYaml.matchAll(/-\s+'([^']+)'/g)].map(m => m[1]);

    const packages = [];
    for (const pattern of patterns) {
        const baseDir = pattern.replace('/*', '');
        const fullBaseDir = path.join(rootDir, baseDir);
        if (!fs.existsSync(fullBaseDir)) continue;

        for (const dir of fs.readdirSync(fullBaseDir)) {
            const pkgJsonPath = path.join(fullBaseDir, dir, 'package.json');
            if (!fs.existsSync(pkgJsonPath)) continue;

            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
            if (pkgJson.private) continue;

            packages.push({
                name: pkgJson.name,
                version: pkgJson.version,
                location: path.join(fullBaseDir, dir),
            });
        }
    }
    return packages;
}

function findFiles(dir, extensions = ['.js', '.ts', '.json', '.d.ts', '.md', '.jsx', '.tsx', '.yml', '.yaml']) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            files.push(...findFiles(fullPath, extensions));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
        }
    }
    return files;
}

function replacePackageReferences(pkgLocation) {
    const files = findFiles(pkgLocation);
    for (const file of files) {
        try {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;
            if (content.includes('@ringai/')) {
                content = content.replace(/@ringai\//g, '@ringai-dev/');
                modified = true;
            }
            if (content.includes("'ringai'")) {
                content = content.replace(/'ringai'/g, "'ringai-dev'");
                modified = true;
            }
            if (content.includes('"ringai"')) {
                content = content.replace(/"ringai"/g, '"ringai-dev"');
                modified = true;
            }
            if (modified) {
                fs.writeFileSync(file, content);
            }
        } catch (error) {
            process.stderr.write(`Error processing file ${file}: ${error.message}\n`);
        }
    }
}

function restorePackageReferences(pkgLocation) {
    const files = findFiles(pkgLocation);
    for (const file of files) {
        try {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;
            if (content.includes('@ringai-dev/')) {
                content = content.replace(/@ringai-dev\//g, '@ringai/');
                modified = true;
            }
            if (content.includes("'ringai-dev'")) {
                content = content.replace(/'ringai-dev'/g, "'ringai'");
                modified = true;
            }
            if (content.includes('"ringai-dev"')) {
                content = content.replace(/"ringai-dev"/g, '"ringai"');
                modified = true;
            }
            if (modified) {
                fs.writeFileSync(file, content);
            }
        } catch (error) {
            process.stderr.write(`Error processing file ${file}: ${error.message}\n`);
        }
    }
}

function createDevPackageJson(pkg) {
    const packageJsonPath = path.join(pkg.location, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devVersion = `${packageJson.version}-${githubUsername}-${commitId}`;

    let devName;
    if (packageJson.name === 'ringai') {
        devName = 'ringai-dev';
    } else if (packageJson.name.startsWith('@ringai/')) {
        devName = packageJson.name.replace('@ringai/', '@ringai-dev/');
    } else {
        devName = packageJson.name;
    }

    const devPackageJson = { ...packageJson, name: devName, version: devVersion };

    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        if (devPackageJson[depType]) {
            const newDeps = {};
            for (const [depName, depVersion] of Object.entries(devPackageJson[depType])) {
                if (depName === 'ringai') {
                    newDeps['ringai-dev'] = `${depVersion}-${githubUsername}-${commitId}`;
                } else if (depName.startsWith('@ringai/') && !depName.startsWith('@ringai-dev/')) {
                    const devDepName = depName.replace('@ringai/', '@ringai-dev/');
                    newDeps[devDepName] = `${depVersion}-${githubUsername}-${commitId}`;
                } else {
                    newDeps[depName] = depVersion;
                }
            }
            devPackageJson[depType] = newDeps;
        }
    }
    return devPackageJson;
}

async function publishPackage(pkg) {
    let displayName = pkg.name;
    let originalPackageJson = null;

    if (isDevPublish) {
        const devPackageJson = createDevPackageJson(pkg);
        displayName = devPackageJson.name;
        const pkgJsonPath = path.join(pkg.location, 'package.json');
        originalPackageJson = fs.readFileSync(pkgJsonPath, 'utf8');
        replacePackageReferences(pkg.location);
        fs.writeFileSync(pkgJsonPath, JSON.stringify(devPackageJson, null, 2));
    }

    process.stdout.write(`Publishing: ${displayName} (${pkg.location})\n`);
    let published = false;

    try {
        if (isDryRun) {
            process.stdout.write(`  [DRY RUN] Would publish ${displayName}\n`);
            published = true;
        } else {
            await npmPublish({ package: pkg.location, token, access: 'public' });
            published = true;
        }
    } catch (error) {
        process.stderr.write(`  Error: ${error.message}\n`);
    } finally {
        if (isDevPublish && originalPackageJson) {
            const pkgJsonPath = path.join(pkg.location, 'package.json');
            fs.writeFileSync(pkgJsonPath, originalPackageJson);
            restorePackageReferences(pkg.location);
        }
    }
    return { name: displayName, published };
}

async function main() {
    if (isDevPublish) {
        if (!githubUsername) throw new Error('--github-username is required for dev publishing');
        if (!commitId) throw new Error('--commit-id is required for dev publishing');
        process.stdout.write(`Dev publishing: user=${githubUsername}, commit=${commitId}\n`);
    }

    const allPackages = getWorkspacePackages();
    const filtered = allPackages.filter(pkg => !excludeList.includes(pkg.name));

    process.stdout.write(`Found ${filtered.length} packages to publish\n`);

    let published = 0;
    for (const pkg of filtered) {
        const result = await publishPackage(pkg);
        if (result.published) published++;
    }

    process.stdout.write(`Packages published: ${published}/${filtered.length}\n`);
}

main().catch((e) => {
    process.stderr.write(e.toString() + '\n');
    process.exit(1);
});
