;(function ($) {

	/**
	 * Toggle postbox
	 *
	 * @param e
	 */
	function togglePostbox(e) {
		$(e.target).closest('.postbox').toggleClass('closed')
	}

	/**
	 * Show/hide a tab in course settings page.
	 */
	function showHideCourseSettingsTabs(e) {
		var $tab = $(e.target).closest('.course-tab');

		if (!$tab.length) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		var id = $tab.siblings().removeClass('active').end().addClass('active').data('tab'),
			$container = $('#learn-press-admin-editor-metabox-settings .tabs-container'),
			$activeTab = $tab.closest('.tabs-nav')
				.siblings('.tabs-content-container')
				.children()
				.removeClass('active')
				.filter('.' + id)
				.addClass('active');

		$.ajax({
			url : lpGlobalSettings.ajax,
			data: {
				action  : 'update_current_course_settings_tab',
				tab     : id,
				courseID: lpFrontendCourseEditorSettings.Course_Store_Data.course_ID
			}
		});

		setTimeout(function ($t, $c) {
			$t.css('min-height', $c.height());
		}, 10, $activeTab, $container)
	}

	var lpFrontendCourseEditorSettings;

	$(document).on('FE.editor-rendered', function () {

		var el_lpFrontendCourseEditorSettings = $('input[name=lpFrontendCourseEditorSettings]');

		if (!el_lpFrontendCourseEditorSettings.length) {
			return;
		}

		var lpFrontendCourseEditorSettings_str = el_lpFrontendCourseEditorSettings.val();

		lpFrontendCourseEditorSettings = JSON.parse(lpFrontendCourseEditorSettings_str);
		// el_lpFrontendCourseEditorSettings.val('');

		var $body = $('body.page-frontend-editor'),
			$metaboxSettings = $('#learn-press-admin-editor-metabox-settings');

		if ($body.length) {
			$body.parent().css('overflow', 'hidden');
			$('#edit-slug-buttons').find('.edit-slug').addClass('e-button');

			setTimeout(function () {
				// Hacking to hide the floating menu (eduma)
				$(window).scrollTop(100000);
			}, 1000)

			$(document).on('click', '.postbox .handlediv', togglePostbox);
			$(document).on('click', '#learn-press-admin-editor-metabox-settings', showHideCourseSettingsTabs)

			var $activeTab = $metaboxSettings.find('.course-tab.active');

			if ($activeTab.length) {
				$activeTab.trigger('click');
			} else {
				$metaboxSettings.find('.course-tab').first().trigger('click')
			}
		}
	});


})(jQuery);