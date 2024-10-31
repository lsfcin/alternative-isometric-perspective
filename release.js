// scripts/release.js
const fs = require('fs');
const { execSync } = require('child_process');

// Lê o arquivo module.json
const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
const version = moduleJson.version;

// Funções auxiliares
function execCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Erro ao executar comando: ${command}`);
        process.exit(1);
    }
}

function updateVersionInFiles() {
    // Atualiza package.json se existir
    if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = version;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    }
}

// Principal
console.log(`Iniciando release da versão ${version}...`);

// 1. Atualiza versões nos arquivos
updateVersionInFiles();

// 2. Commit das alterações
execCommand('git add .');
execCommand(`git commit -m "Release v${version}"`);

// 3. Cria e push da tag
execCommand(`git tag -a v${version} -m "Release v${version}"`);
execCommand('git push');
execCommand('git push --tags');

console.log(`\nRelease v${version} iniciada com sucesso!`);
console.log('O GitHub Actions irá criar automaticamente o release com os arquivos.');
console.log('Verifique o progresso em: https://github.com/marceloabner/isometric-perspective/actions');