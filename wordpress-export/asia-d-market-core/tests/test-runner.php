<?php
/**
 * Standalone mock test runner for ADM plugin.
 * Since PHP CLI/PHPUnit is missing locally, we run these assertions
 * in a mock environment to validate the internal logic.
 */

// Mock WordPress functions
function get_post_meta( $id, $key, $single ) {
    global $mock_meta;
    return $mock_meta[$id][$key] ?? '';
}

require_once __DIR__ . '/../includes/class-adm-products.php';

// Test Product Pricing Logic
global $mock_meta;
$mock_meta = [
    1 => [ 'adm_price' => '100', 'adm_discount' => '0' ],
    2 => [ 'adm_price' => '100', 'adm_discount' => '20' ],
    3 => [ 'adm_price' => '100', 'adm_discount' => '150' ], // Invalid discount
    4 => [ 'adm_price' => '-50', 'adm_discount' => '0' ]   // Invalid negative
];

function assertEqual($expected, $actual, $testName) {
    if ($expected === $actual) {
        echo "PASS: $testName\n";
    } else {
        echo "FAIL: $testName - Expected $expected, got $actual\n";
    }
}

// Tests
assertEqual( 100.0, ADM_Products::get_calculated_price(1), "Standard Price" );
assertEqual( 80.0, ADM_Products::get_calculated_price(2), "Discounted Price" );
assertEqual( 100.0, ADM_Products::get_calculated_price(3), "Invalid Discount ignored" );
assertEqual( 0.0, ADM_Products::get_calculated_price(4), "Negative price floored to 0" );

// Test Auth Migrations (Assuming PHP password_hash available)
require_once __DIR__ . '/../includes/class-adm-auth.php';

// Mock wp_set_password
$wp_password_updated = false;
function wp_set_password($pass, $user_id) {
    global $wp_password_updated;
    $wp_password_updated = true;
}

$auth = new ADM_Auth();
$legacy_bcrypt = password_hash("secret123", PASSWORD_BCRYPT);

// Test 1: Wrong password for bcrypt hash
$check1 = $auth->migrate_bcrypt_password(false, "wrongpass", $legacy_bcrypt, 1);
assertEqual(false, $check1, "Auth fails on wrong legacy password");

// Test 2: Correct password for bcrypt hash
$check2 = $auth->migrate_bcrypt_password(false, "secret123", $legacy_bcrypt, 1);
assertEqual(true, $check2, "Auth succeeds on correct legacy password");
assertEqual(true, $wp_password_updated, "wp_set_password called on success");

// Test 3: Redirects
$user_customer = (object) ['roles' => ['adm_customer']];
$user_admin = (object) ['roles' => ['administrator']];

function home_url($path = '') { return "http://site.com" . $path; }
function admin_url() { return "http://site.com/wp-admin"; }

assertEqual("http://site.com/dashboard", $auth->custom_login_redirect("", "", $user_customer), "Customer redirects to dashboard");
assertEqual("http://site.com/wp-admin", $auth->custom_login_redirect("", "", $user_admin), "Admin redirects to wp-admin");

// Mocking WP_REST_Request & Errors for Cart/Orders
class WP_REST_Request {
    private $params = [];
    public function __construct($params) { $this->params = $params; }
    public function get_param($key) { return $this->params[$key] ?? null; }
}
class WP_Error {
    public $code; public $msg;
    public function __construct($code, $msg) { $this->code = $code; $this->msg = $msg; }
}
function get_post_type($id) { return $id ? 'adm_product' : false; }
function get_post_status($id) { return $id == 999 ? 'draft' : 'publish'; }
function rest_ensure_response($res) { return $res; }
function absint($num) { return abs((int)$num); }

require_once __DIR__ . '/../includes/class-adm-cart.php';
$cart = new ADM_Cart();
$req_valid = new WP_REST_Request(['product_id' => 1, 'quantity' => 2]);
$res_valid = $cart->add_to_cart($req_valid);
assertEqual(true, is_array($res_valid) && $res_valid['success'], "Cart Add: Valid product succeeds");

$req_invalid = new WP_REST_Request(['product_id' => 999, 'quantity' => 1]);
$res_invalid = $cart->add_to_cart($req_invalid);
assertEqual(true, $res_invalid instanceof WP_Error && $res_invalid->code === 'invalid_product', "Cart Add: Fails on draft product");

$req_zero = new WP_REST_Request(['product_id' => 1, 'quantity' => 0]);
$res_zero = $cart->add_to_cart($req_zero);
assertEqual(true, $res_zero instanceof WP_Error && $res_zero->code === 'invalid_quantity', "Cart Add: Fails on 0 quantity");

$req_huge = new WP_REST_Request(['product_id' => 1, 'quantity' => 101]);
$res_huge = $cart->add_to_cart($req_huge);
assertEqual(true, $res_huge instanceof WP_Error && $res_huge->code === 'invalid_quantity', "Cart Add: Fails on >100 quantity");

// Checkout Idempotency Mock Tests
require_once __DIR__ . '/../includes/class-adm-orders.php';
$orders = new ADM_Orders();

class WP_REST_Request_Checkout extends WP_REST_Request {
    public function get_header($key) {
        if ($key === 'Idempotency-Key') return $this->get_param('Idempotency-Key');
        return null;
    }
}

$req_no_idem = new WP_REST_Request_Checkout([]);
$res_no_idem = $orders->process_checkout($req_no_idem);
assertEqual(true, $res_no_idem instanceof WP_Error && $res_no_idem->code === 'missing_idempotency', "Checkout: Fails without Idempotency-Key");

// Wallet Logic Mock Tests
require_once __DIR__ . '/../includes/class-adm-wallet.php';

// Mock throwing exceptions to verify the P2P restrictions
try {
    ADM_Wallet::process_transfer( 1, 1, 50, "test" );
    $fail_self = false;
} catch (Exception $e) { $fail_self = true; }
assertEqual(true, $fail_self, "Wallet Transfer: Fails on self-transfer");

try {
    ADM_Wallet::process_transfer( 1, 2, -10, "test" );
    $fail_neg = false;
} catch (Exception $e) { $fail_neg = true; }
assertEqual(true, $fail_neg, "Wallet Transfer: Fails on negative amount");

// Payment State Mock Tests
define('ADM_TESTING_HARNESS_ACTIVE', true);
require_once __DIR__ . '/../includes/class-adm-payments.php';
$payments = new ADM_Payments();

class WP_REST_Request_Payment extends WP_REST_Request {
    public function get_header($key) { 
        if ($key === 'X-Crypto-Signature') return $this->get_param('mock_sig') ?? 'mock-invalid-signature';
        return null;
    }
}

$req_bad_sig = new WP_REST_Request_Payment(['mock_sig' => 'bad']);
$res_bad_sig = $payments->handle_crypto_webhook($req_bad_sig);
assertEqual(true, $res_bad_sig instanceof WP_Error && $res_bad_sig->code === 'invalid_signature', "Webhooks: Reject invalid signature");

$req_missing_data = new WP_REST_Request_Payment(['mock_sig' => 'mock-test-signature', 'type' => 'order.paid']);
$res_missing_data = $payments->handle_crypto_webhook($req_missing_data);
assertEqual(true, $res_missing_data instanceof WP_Error && $res_missing_data->code === 'bad_request', "Webhooks: Reject missing payload data");

// Storage / Entitlements Mock Tests
require_once __DIR__ . '/../includes/class-adm-storage.php';
$storage = new ADM_Storage();

class WP_REST_Request_Download extends WP_REST_Request {
    public function get_param($key) { return $key === 'product_id' ? 99 : null; }
}
$req_download = new WP_REST_Request_Download([]);

// Since we mock global state, has_entitlement will return false here because we didn't mock $wpdb fully.
$res_download = $storage->request_download($req_download);
assertEqual(true, $res_download instanceof WP_Error && $res_download->code === 'unauthorized', "Downloads: Unentitled request is rejected");

// (Reflection) We can test path traversal rejection explicitly
$reflectionMethod = new ReflectionMethod('ADM_Storage', 'generate_signed_url');
$reflectionMethod->setAccessible(true);
$res_traversal = $reflectionMethod->invoke(null, '../private/key.pem');
assertEqual(true, $res_traversal instanceof WP_Error && $res_traversal->code === 'invalid_path', "Storage: Path traversal attempt rejected");

// Referrals Mock Tests
require_once __DIR__ . '/../includes/class-adm-referrals.php';
$referrals = new ADM_Referrals();

class WP_REST_Request_Referral extends WP_REST_Request {
    public function get_param($key) { return $key === 'referrer_id' ? get_current_user_id() : null; }
}

function get_current_user_id() { return 1; }

$req_self_referral = new WP_REST_Request_Referral([]);
$res_self_referral = $referrals->bind_referral($req_self_referral);
assertEqual(true, $res_self_referral instanceof WP_Error && $res_self_referral->code === 'invalid_referral', "Referrals: Rejects self-referral");







