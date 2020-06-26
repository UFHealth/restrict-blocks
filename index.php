<?php

/**
 * Plugin Name: UF Health Restrict Blocks
 * Description: Restrict block availability based on page templates.
 * Version: 1.0.0
 * Text Domain: ufhealth-restrict-blocks
 * Domain Path: /languages
 * Author: UF Health
 * Author URI: http://webservices.ufhealth.org
 * License: GPLv2
 */


function enqueue_scripts () {
    wp_enqueue_script('ufhealth-restrict-blocks', plugin_dir_url(__FILE__).'dist/main.js', ['wp-editor', 'wp-blocks'], '1.0', true);
}

add_action('enqueue_block_editor_assets', 'enqueue_scripts');
