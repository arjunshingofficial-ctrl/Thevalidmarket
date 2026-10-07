const fs = require('fs');
const path = require('path');

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

// 1. ProductCard
replaceInFile('src/components/product/ProductCard.tsx', [
    { regex: /₹\{product\.price\}/g, replace: '${product.price}' },
    { regex: /₹\{price\}/g, replace: '${price}' },
    { regex: /₹\{product\.salePrice\}/g, replace: '${product.salePrice}' }
]);

// 2. CategoryProductSection
replaceInFile('src/components/home/CategoryProductSection.tsx', [
    { regex: /₹\{product\.price\.toFixed\(2\)\}/g, replace: '${product.price.toFixed(2)}' },
    { regex: /₹\{price\.toFixed\(2\)\}/g, replace: '${price.toFixed(2)}' }
]);

// 3. ProductEditor
replaceInFile('src/components/admin/ProductEditor.tsx', [
    { regex: /Price \(₹\)/g, replace: 'Price ($)' },
    { regex: /Compare Price \(₹\)/g, replace: 'Compare Price ($)' },
    { regex: /Sale Price \(₹\)/g, replace: 'Sale Price ($)' }
]);

// 4. Admin Orders
replaceInFile('src/app/admin/orders/[id]/page.tsx', [
    { regex: /₹\{item\.price\}/g, replace: '${item.price}' },
    { regex: /₹\{order\.subtotal\}/g, replace: '${order.subtotal}' },
    { regex: /₹\{order\.total\}/g, replace: '${order.total}' },
    { regex: /₹\{order\.tax\}/g, replace: '${order.tax}' },
    { regex: /₹\{order\.discount\}/g, replace: '${order.discount}' }
]);
replaceInFile('src/app/admin/orders/page.tsx', [
    { regex: /₹\{order\.total\}/g, replace: '${order.total}' }
]);

// 5. Customer Dashboard Orders
replaceInFile('src/app/(storefront)/dashboard/orders/page.tsx', [
    { regex: /₹\{order\.total\}/g, replace: '${order.total}' }
]);
replaceInFile('src/app/(storefront)/dashboard/orders/[id]/page.tsx', [
    { regex: /₹\{item\.price\.toLocaleString\(\)\}/g, replace: '${item.price.toLocaleString()}' },
    { regex: /₹\{order\.subtotal\.toLocaleString\(\)\}/g, replace: '${order.subtotal.toLocaleString()}' },
    { regex: /-₹\{order\.discount\.toLocaleString\(\)\}/g, replace: '-$${order.discount.toLocaleString()}' },
    { regex: /₹\{order\.tax\.toLocaleString\(\)\}/g, replace: '${order.tax.toLocaleString()}' },
    { regex: /₹\{order\.total\.toLocaleString\(\)\}/g, replace: '${order.total.toLocaleString()}' }
]);

// 6. Admin Dashboard & Analytics
replaceInFile('src/app/admin/dashboard/page.tsx', [
    { regex: /₹\$\{revenue\.toLocaleString\(\)\}/g, replace: '$$${revenue.toLocaleString()}' },
    { regex: /₹\{order\.total\}/g, replace: '${order.total}' }
]);
replaceInFile('src/app/admin/analytics/page.tsx', [
    { regex: /₹\$\{revenue\.toLocaleString\(\)\}/g, replace: '$$${revenue.toLocaleString()}' },
    { regex: /₹\$\{avgOrderValue\.toFixed\(0\)\}/g, replace: '$$${avgOrderValue.toFixed(0)}' },
    { regex: /₹\{\(m\._sum\.amount \|\| 0\)\.toLocaleString\(\)\}/g, replace: '${(m._sum.amount || 0).toLocaleString()}' },
    { regex: /₹\{\(item\._sum\.price \|\| 0\)\.toLocaleString\(\)\}/g, replace: '${(item._sum.price || 0).toLocaleString()}' }
]);
replaceInFile('src/components/admin/RevenueChart.tsx', [
    { regex: /`₹\$\{val\}`/g, replace: '`$$${val}`' },
    { regex: /`₹\$\{Number\(value\)\.toLocaleString\(\)\}`/g, replace: '`$$${Number(value).toLocaleString()}`' }
]);

// 7. Referrals
replaceInFile('src/app/admin/referrals/page.tsx', [
    { regex: /₹\{totalPendingCommissions\.toFixed\(2\)\}/g, replace: '${totalPendingCommissions.toFixed(2)}' },
    { regex: /₹\{totalCommissionsPaid\.toFixed\(2\)\}/g, replace: '${totalCommissionsPaid.toFixed(2)}' },
    { regex: /₹\{w\.amount\.toFixed\(2\)\}/g, replace: '${w.amount.toFixed(2)}' },
    { regex: /₹\{\(c\.amount \* c\.rate\)\.toFixed\(2\)\}/g, replace: '${(c.amount * c.rate).toFixed(2)}' }
]);
replaceInFile('src/app/(storefront)/dashboard/referrals/page.tsx', [
    { regex: /₹\{totalEarned\.toFixed\(2\)\}/g, replace: '${totalEarned.toFixed(2)}' },
    { regex: /₹\{pending\.toFixed\(2\)\}/g, replace: '${pending.toFixed(2)}' },
    { regex: /₹\{available\.toFixed\(2\)\}/g, replace: '${available.toFixed(2)}' },
    { regex: /₹\{earned\}/g, replace: '${earned}' },
    { regex: /withdrawal: ₹500/g, replace: 'withdrawal: $10' }
]);
replaceInFile('src/components/referrals/WithdrawalClient.tsx', [
    { regex: /amount is ₹500/g, replace: 'amount is $10' },
    { regex: /₹\{availableAmount\.toFixed\(2\)\}/g, replace: '${availableAmount.toFixed(2)}' },
    { regex: /Amount \(₹\)/g, replace: 'Amount ($)' },
    { regex: /withdrawal: ₹500/g, replace: 'withdrawal: $10' }
]);
replaceInFile('src/app/admin/referrals/withdrawals/[id]/page.tsx', [
    { regex: /₹\{withdrawal\.amount\.toFixed\(2\)\}/g, replace: '${withdrawal.amount.toFixed(2)}' }
]);
replaceInFile('src/app/api/referrals/withdraw/route.ts', [
    { regex: /amount\. Minimum is ₹500/g, replace: 'amount. Minimum is $10' },
    { regex: /amount < 500/g, replace: 'amount < 10' }
]);

// 8. Admin Products
replaceInFile('src/app/admin/products/page.tsx', [
    { regex: /₹\{product\.salePrice \|\| product\.price\}/g, replace: '${product.salePrice || product.price}' }
]);

// 9. Admin Customers
replaceInFile('src/app/admin/customers/page.tsx', [
    { regex: /₹\{totalSpent\.toFixed\(2\)\}/g, replace: '${totalSpent.toFixed(2)}' }
]);
replaceInFile('src/app/admin/customers/[id]/page.tsx', [
    { regex: /₹\$\{totalSpent\.toFixed\(2\)\}/g, replace: '$$${totalSpent.toFixed(2)}' },
    { regex: /₹\{order\.total\}/g, replace: '${order.total}' }
]);

// 10. Admin Coupons
replaceInFile('src/app/admin/coupons/page.tsx', [
    { regex: /`₹\$\{coupon\.discountValue\}`/g, replace: '`$$${coupon.discountValue}`' }
]);

// 11. Locations
replaceInFile('src/app/admin/locations/page.tsx', [
    { regex: /currency: "INR \(₹\) \/ USD"/g, replace: 'currency: "USD"' }
]);

console.log("Done");
