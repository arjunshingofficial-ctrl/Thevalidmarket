const fs = require('fs');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

replaceInFile('src/components/admin/CouponForm.tsx', [
    { regex: /Fixed Amount \(₹\)/g, replace: 'Fixed Amount ($)' }
]);

replaceInFile('src/app/admin/payments/review/page.tsx', [
    { regex: /₹\{p\.amount\.toLocaleString\(\)\}/g, replace: '${p.baseAmount ? p.baseAmount.toLocaleString() : p.amount.toLocaleString()} USD' }
]);

replaceInFile('src/app/admin/payments/page.tsx', [
    { regex: /₹\{payment\.amount\.toLocaleString\(\)\}/g, replace: '${payment.baseAmount ? payment.baseAmount.toLocaleString() : payment.amount.toLocaleString()} USD' }
]);

replaceInFile('src/app/(storefront)/product/[slug]/page.tsx', [
    { regex: /₹\{product\.salePrice \?\? product\.price\}/g, replace: '${product.salePrice ?? product.price}' },
    { regex: /₹\{product\.price\}/g, replace: '${product.price}' },
    { regex: /Save ₹\{\(product\.price - product\.salePrice\)\.toFixed\(2\)\}/g, replace: 'Save $${(product.price - product.salePrice).toFixed(2)}' }
]);

replaceInFile('src/app/(storefront)/dashboard/page.tsx', [
    { regex: /₹\$\{totalSpent\.toLocaleString\(\)\}/g, replace: '$$${totalSpent.toLocaleString()}' },
    { regex: /₹\{order\.total\.toLocaleString\(\)\}/g, replace: '${order.total.toLocaleString()}' }
]);

replaceInFile('src/app/(storefront)/dashboard/orders/[id]/invoice/page.tsx', [
    { regex: /₹\{item\.price\.toLocaleString\(\)\}/g, replace: '${item.price.toLocaleString()}' },
    { regex: /₹\{\(item\.price \* item\.quantity\)\.toLocaleString\(\)\}/g, replace: '${(item.price * item.quantity).toLocaleString()}' },
    { regex: /₹\{order\.subtotal\.toLocaleString\(\)\}/g, replace: '${order.subtotal.toLocaleString()}' },
    { regex: /-₹\{order\.discount\.toLocaleString\(\)\}/g, replace: '-$${order.discount.toLocaleString()}' },
    { regex: /₹\{order\.tax\.toLocaleString\(\)\}/g, replace: '${order.tax.toLocaleString()}' },
    { regex: /₹\{order\.total\.toLocaleString\(\)\}/g, replace: '${order.total.toLocaleString()}' }
]);

replaceInFile('src/app/(storefront)/category/[slug]/CategoryClient.tsx', [
    { regex: /₹\{product\.price\}/g, replace: '${product.price}' },
    { regex: /₹\{price\}/g, replace: '${price}' }
]);

replaceInFile('src/app/(storefront)/category/[slug]/BBCategoryTemplate.tsx', [
    { regex: /₹\{Number\(product\.price\)\.toLocaleString\("en-IN"\)\}/g, replace: '${Number(product.price).toLocaleString("en-US")}' },
    { regex: /₹\{Number\(price\)\.toLocaleString\("en-IN"\)\}/g, replace: '${Number(price).toLocaleString("en-US")}' },
    { regex: /₹\{Math\.round\(stats\.avgPrice\)\.toLocaleString\("en-IN"\)\}/g, replace: '${Math.round(stats.avgPrice).toLocaleString("en-US")}' }
]);

console.log("Done 2");
