<?php
$files = glob( __DIR__ . '/wordpress-export/asia-d-market-core/includes/*.php' );
$files[] = __DIR__ . '/wordpress-export/asia-d-market-core/asia-d-market-core.php';

foreach ( $files as $file ) {
    try {
        // Just reading the file doesn't parse it.
        // We can use php -l if it's available, but it wasn't.
        // Let's use eval() with stripping <?php to check for parse errors
        $code = file_get_contents($file);
        $code = str_replace('<?php', '', $code);
        $code = str_replace('?>', '', $code);
        
        try {
            eval('return true; ' . $code);
        } catch (ParseError $e) {
            echo "Parse error in $file: " . $e->getMessage() . "\n";
        }
    } catch (Exception $e) {
        echo "Error in $file: " . $e->getMessage() . "\n";
    }
}
echo "Check complete.";
