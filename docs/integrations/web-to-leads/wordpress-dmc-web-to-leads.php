<?php
/**
 * Plugin Name: DMC CRM Web-to-Leads
 * Description: Sends Contact Form 7 leads to the DMC CRM via curl.
 * Version: 2.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wpcf7_before_send_mail', 'dmc_crm_save_posted_data');

/**
 * @param object $contact_form WPCF7_ContactForm instance
 * @return void
 */
function dmc_crm_save_posted_data($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) {
        return;
    }

    $data = $submission->get_posted_data();

    // Safely read the first string value from a CF7 field (may be scalar or array).
    $field = function (string $key, string $fallback = '') use ($data): string {
        $value = $data[$key] ?? $fallback;
        if (is_array($value)) {
            $value = $value[0] ?? $fallback;
        }
        $value = sanitize_text_field((string) $value);
        return $value !== '' ? $value : $fallback;
    };

    $name  = $field('your-name');
    $email = sanitize_email((string) ($data['your-email'] ?? ''));
    $phone = $field('phonetext-718');

    // Bail silently if required fields are missing — this form is not a lead form.
    if (!$name || !$email || !$phone) {
        return;
    }

    // UTM source: prefer a hidden CF7 field, fall back to the utm_source cookie.
    $utm_source = $field('utm_source')
        ?: sanitize_text_field((string) ($_COOKIE['utm_source'] ?? ''))
        ?: 'Dubai Website';

    $url     = 'https://dmcone.org/api/web-to-leads';
    $api_key = defined('DMC_WEB_TO_LEADS_API_KEY') ? DMC_WEB_TO_LEADS_API_KEY : '';

    $post_params = array(
        'lastName'           => $name,
        'email'              => $email,
        'phone'              => $phone,
        'AgeRange'           => $field('menu-359'),
        'ImmigrationType'    => $field('menu-55692'),
        'Branch'             => $field('menu-404'),
        'ResidentCountry'    => $field('residentCountry', 'UAE'),
        'UTMSource'          => $utm_source,
        'Education'          => $field('menu-35926'),
        'DestinationCountry' => $field('menu-3065'),
        'LeadSource'         => 'SEO Leads (English)',
    );

    $payload = json_encode($post_params, JSON_UNESCAPED_UNICODE);

    $headers = array(
        'Content-Type: application/json',
        'Content-Length: ' . strlen($payload),
    );
    if ($api_key) {
        $headers[] = 'x-api-key: ' . $api_key;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_ENCODING       => '',
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ));

    $response   = curl_exec($ch);
    $http_code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    $form_title = $contact_form->title();

    if ($curl_error) {
        error_log("DMC CRM curl error [{$form_title}]: {$curl_error}");
        return;
    }

    if ($http_code < 200 || $http_code >= 300) {
        error_log("DMC CRM lead submission failed [{$form_title}]. HTTP {$http_code} Response: {$response}");
    }
}
