    </main>

    <footer class="border-t border-border mt-12 py-12 bg-card">
        <div class="container max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 class="text-lg font-bold text-foreground mb-4">Asia D Market</h3>
                    <p class="text-sm text-muted-foreground">Your premium marketplace for digital products, VPNs, and proxies.</p>
                </div>
                <div>
                    <h3 class="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Quick Links</h3>
                    <ul class="space-y-2">
                        <li><a href="/" class="text-sm text-muted-foreground hover:text-primary">Home</a></li>
                        <li><a href="/shop" class="text-sm text-muted-foreground hover:text-primary">Store</a></li>
                        <li><a href="/dashboard" class="text-sm text-muted-foreground hover:text-primary">Dashboard</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Legal</h3>
                    <ul class="space-y-2">
                        <li><a href="#" class="text-sm text-muted-foreground hover:text-primary">Terms of Service</a></li>
                        <li><a href="#" class="text-sm text-muted-foreground hover:text-primary">Privacy Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Connect</h3>
                    <p class="text-sm text-muted-foreground">Contact support via Telegram or WhatsApp for assistance.</p>
                </div>
            </div>
            <div class="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                <p class="text-sm text-muted-foreground">
                    &copy; <?php echo date('Y'); ?> Asia D Market. All rights reserved.
                </p>
            </div>
        </div>
    </footer>

    <!-- Initialize Lucide Icons -->
    <script>
      lucide.createIcons();
    </script>
    <?php wp_footer(); ?>
</body>
</html>
