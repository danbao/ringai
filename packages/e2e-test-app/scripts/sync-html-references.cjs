const fs = require('fs');
const path = require('path');

/**
 * 转义 HTML 内容中的特殊字符
 */
function escapeHtmlContent(htmlContent) {
    return htmlContent
        .replace(/`/g, '\\`')  // 转义反引号
        .replace(/\$/g, '\\$');  // 转义美元符号
}

/**
 * 更新 .ts 文件，让它们直接引用原始的 .html 文件
 */
function updateHtmlReferences() {
    const staticFixturesDir = path.join(__dirname, '..', 'src', 'static-fixtures');
    const originalHtmlDir = path.join(__dirname, '..', 'static-fixtures');
    
    if (!fs.existsSync(staticFixturesDir)) {
        console.error('❌ src/static-fixtures 目录不存在:', staticFixturesDir);
        return;
    }
    
    if (!fs.existsSync(originalHtmlDir)) {
        console.error('❌ static-fixtures 目录不存在:', originalHtmlDir);
        return;
    }
    
    const tsFiles = fs.readdirSync(staticFixturesDir)
        .filter(file => file.endsWith('.ts') && !file.includes('.html'));
    
    console.log(`🚀 开始更新 ${tsFiles.length} 个 .ts 文件...\n`);
    
    let updatedCount = 0;
    
    tsFiles.forEach(file => {
        const tsPath = path.join(staticFixturesDir, file);
        const htmlFileName = file.replace('.ts', '.html');
        const htmlPath = path.join(originalHtmlDir, htmlFileName);
        
        // 检查对应的 HTML 文件是否存在
        if (!fs.existsSync(htmlPath)) {
            console.log(`⚠️  跳过 ${file}: 对应的 ${htmlFileName} 不存在`);
            return;
        }
        
        try {
            // 读取原始 HTML 内容
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            // 转义 HTML 内容
            const escapedHtmlContent = escapeHtmlContent(htmlContent);
            
            // 生成函数名（首字母大写）
            const baseName = file.replace('.ts', '');
            const functionName = `get${baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/[-_](.)/g, (_, c) => c.toUpperCase())}Html`;
            
            // 生成新的 TypeScript 文件内容
            const newContent = `import { Context } from 'hono';

export function ${functionName}(c: Context) {
    const html = \`${escapedHtmlContent}\`;
    return c.html(html);
}
`;
            
            // 写入新的内容
            fs.writeFileSync(tsPath, newContent);
            console.log(`✅ 已更新: ${file} (引用 ${htmlFileName})`);
            updatedCount++;
            
        } catch (error) {
            console.error(`❌ 更新 ${file} 时出错:`, error.message);
        }
    });
    
    console.log(`\n📊 更新统计:`);
    console.log(`  - 总文件数: ${tsFiles.length}`);
    console.log(`  - 成功更新: ${updatedCount}`);
    console.log(`  - 跳过文件: ${tsFiles.length - updatedCount}`);
    
    return updatedCount;
}

/**
 * 验证更新结果
 */
function verifyUpdates() {
    const staticFixturesDir = path.join(__dirname, '..', 'src', 'static-fixtures');
    const originalHtmlDir = path.join(__dirname, '..', 'static-fixtures');
    
    const tsFiles = fs.readdirSync(staticFixturesDir)
        .filter(file => file.endsWith('.ts') && !file.includes('.html'));
    
    console.log('\n🔍 验证更新结果...\n');
    
    let verifiedCount = 0;
    
    tsFiles.forEach(file => {
        const tsPath = path.join(staticFixturesDir, file);
        const htmlFileName = file.replace('.ts', '.html');
        const htmlPath = path.join(originalHtmlDir, htmlFileName);
        
        if (!fs.existsSync(htmlPath)) {
            return;
        }
        
        try {
            const tsContent = fs.readFileSync(tsPath, 'utf8');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            // 检查 TypeScript 文件是否包含转义后的 HTML 内容
            const escapedHtmlContent = escapeHtmlContent(htmlContent);
            if (tsContent.includes(escapedHtmlContent.trim())) {
                console.log(`✅ ${file} 正确引用了 ${htmlFileName}`);
                verifiedCount++;
            } else {
                console.log(`❌ ${file} 未正确引用 ${htmlFileName}`);
            }
            
        } catch (error) {
            console.error(`❌ 验证 ${file} 时出错:`, error.message);
        }
    });
    
    console.log(`\n📊 验证统计:`);
    console.log(`  - 验证成功: ${verifiedCount}`);
    console.log(`  - 验证失败: ${tsFiles.length - verifiedCount}`);
}

/**
 * 主函数
 */
function main() {
    console.log('🔄 开始同步 HTML 引用...\n');
    
    // 更新文件
    const updatedCount = updateHtmlReferences();
    
    if (updatedCount > 0) {
        console.log('\n🔄 验证更新结果...\n');
        verifyUpdates();
    }
    
    console.log('\n✅ 同步完成！');
    console.log('📝 提示: 现在所有 .ts 文件都直接引用原始的 .html 文件，并正确处理转义');
}

// 运行脚本
if (require.main === module) {
    main();
}

module.exports = { updateHtmlReferences, verifyUpdates, escapeHtmlContent }; 