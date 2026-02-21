#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const mockGithubUsername = 'testuser';
const mockCommitId = 'abc1234';
const excludeList = ['@testring/devtool-frontend', '@testring/devtool-backend', '@testring/devtool-extension'];

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

function createDevPackageJson(pkg) {
    const packageJsonPath = path.join(pkg.location, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devVersion = `${packageJson.version}-${mockGithubUsername}-${mockCommitId}`;

    let devName;
    if (packageJson.name === 'testring') {
        devName = 'testring-dev';
    } else if (packageJson.name.startsWith('@testring/')) {
        devName = packageJson.name.replace('@testring/', '@testring-dev/');
    } else {
        devName = packageJson.name;
    }

    const devPackageJson = { ...packageJson, name: devName, version: devVersion };

    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        if (devPackageJson[depType]) {
            const newDeps = {};
            for (const [depName, depVersion] of Object.entries(devPackageJson[depType])) {
                if (depName === 'testring') {
                    newDeps['testring-dev'] = `${depVersion}-${mockGithubUsername}-${mockCommitId}`;
                } else if (depName.startsWith('@testring/') && !depName.startsWith('@testring-dev/')) {
                    newDeps[depName.replace('@testring/', '@testring-dev/')] = `${depVersion}-${mockGithubUsername}-${mockCommitId}`;
                } else {
                    newDeps[depName] = depVersion;
                }
            }
            devPackageJson[depType] = newDeps;
        }
    }

    return devPackageJson;
}

async function testDevPublish() {
    console.log('Testing dev publish logic...\n');

    const allPackages = getWorkspacePackages();
    const filtered = allPackages.filter(pkg => !excludeList.includes(pkg.name));

    console.log(`Found ${filtered.length} packages to process:\n`);

    for (const pkg of filtered) {
        const devPkg = createDevPackageJson(pkg);
        console.log(`${pkg.name} -> ${devPkg.name}@${devPkg.version}`);

        const transformedDeps = Object.entries(devPkg.dependencies || {})
            .filter(([name]) => name.startsWith('@testring-dev/') || name === 'testring-dev');
        if (transformedDeps.length > 0) {
            transformedDeps.forEach(([name, version]) => console.log(`  dep: ${name}@${version}`));
        }
    }

    console.log('\nDev publish logic test completed successfully!');
}

testDevPublish();
