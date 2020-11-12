<?php

$packages = array(
	'helpers.min',
	'base.min',
	'stores/section.min',
	'stores/course.min',
	'components/modal-items.min',
	'components/course-curriculum.min',
	'components/course-section.min',
	'components/course-item.min',
	'components/item-settings.min',
	'components/form-fields.min',
	'components/quiz-editor.min',
	'components/question-editor.min',
	'integration.min',
	'course-editor.min',
	'post.min'
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