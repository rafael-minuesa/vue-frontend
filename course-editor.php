<?php

$packages = array(
	'helpers',
	'base',
	'stores/section',
	'stores/course',
	'components/modal-items',
	'components/course-curriculum',
	'components/course-section',
	'components/course-item',
	'components/item-settings',
	'components/form-fields',
	'components/quiz-editor',
	'components/question-editor',
	'integration',
	'course-editor',
	'post'
);

$expires_offset = 31536000; // 1 year

header( 'Content-Type: application/javascript; charset=UTF-8' );
header( 'Expires: ' . gmdate( 'D, d M Y H:i:s', time() + $expires_offset ) . ' GMT' );
header( "Cache-Control: public, max-age=$expires_offset" );

echo ";jQuery(function($){\n";
foreach ( $packages as $package ) {
	readfile( "{$package}.js" );
	echo "\n\n";
}
echo "});";