// release.js
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Lê o module.json para pegar a versão
const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
const version = moduleJson.version;

// Lista de arquivos e pastas para ignorar
const ignoreList = [
    'node_modules',
    '.git',
    '.gitignore',
    'release.js',
    'package.json',
    'package-lock.json',
    '.vscode',
    'module.zip'
];

// Cria o arquivo ZIP
const output = fs.createWriteStream(`module.zip`);
const archive = archiver('zip', {
    zlib: { level: 9 } // Nível máximo de compressão
});

output.on('close', function() {
    console.log(`\nArquivo module.zip criado com sucesso!`);
    console.log(`Tamanho total: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function(err) {
    throw err;
});

archive.pipe(output);

// Adiciona arquivos ao ZIP
fs.readdirSync('.').forEach(file => {
    if (!ignoreList.includes(file)) {
        if (fs.lstatSync(file).isDirectory()) {
            archive.directory(file, file);
        } else {
            archive.file(file, { name: file });
        }
    }
});

archive.finalize();