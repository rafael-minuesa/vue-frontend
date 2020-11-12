;(function ($) {

	/**
	 * Init checkboxes action in column checkbox of post list
	 */
	var initColumnCB = function () {
		var $chkAll = $('#cb-select-all-1, #cb-select-all-2'),
			$chks = $('.check-column').find('input').not($chkAll);

		$chkAll.on('change', function () {
			$chks.prop('checked', this.checked);
			$chkAll.not(this).prop('checked', this.checked);
			toggleActions();
		});

		$chks.on('change', function () {
			var isCheckedAll = $chks.filter(':checked').length === $chks.length;
			if (isCheckedAll) {
				$chkAll.prop('checked', true);
			} else {
				$chkAll.prop('checked', false);
			}
			toggleActions();
		});

		var toggleActions = function () {
			if ($chks.filter(':checked').length) {
				$('.e-table-actions .move-to-trash').removeClass('e-hidden');
				$('.e-table-actions .go-to-trash').addClass('e-hidden');
			} else {
				$('.e-table-actions .move-to-trash').addClass('e-hidden');
				$('.e-table-actions .go-to-trash').removeClass('e-hidden');
			}
		}
	};

	/**
	 * Even handler for button to editing post slug
	 */
	function editSlugBox() {
		var $originSlug = $('#editable-post-name-full'),
			$edit = $('.edit-slug'),
			$save = $('#e-button-save-slug'),
			$cancel = $('#e-button-cancel-slug'),
			$samplePermalink = $('#sample-permalink'),
			$samplePermalinkEditable = $('#e-sample-permalink-editable'),
			originSlug = $originSlug.text();

		$edit.hide();
		$save.show();
		$cancel.show();
		$samplePermalink.hide();
		$samplePermalinkEditable.show().children('input').val(originSlug);

		$save.off('click').on('click', function () {
			var new_slug = $samplePermalinkEditable.children('input').val();

			if (new_slug == originSlug) {
				$cancel.click();
				return;
			}

			$.post(
				_wpUtilSettings.ajax,
				{
					action              : 'sample-permalink',
					post_id             : $('input[name="post_ID"]').val(),
					new_slug            : new_slug,
					new_title           : $('input[name="post_title"]').val(),
					e_post              : 1,
					samplepermalinknonce: $('#samplepermalinknonce').val()
				},
				function (data) {
					var $html = $(data);
					$html.find('.edit-slug').addClass('e-button');
					$('#e-wp-sample-permalink').html($html);

					$edit.show();
					$save.hide();
					$cancel.hide();
					$samplePermalink.show();
					$samplePermalinkEditable.hide();
					$('#post_name').val(new_slug);
				}
			);

		});

		$cancel.off('click').on('click', function () {
			$edit.show();
			$save.hide();
			$cancel.hide();
			$samplePermalink.show();
			$samplePermalinkEditable.hide();
		});

		$samplePermalinkEditable.children('input').off('keydown.update-slug').on('keydown.update-slug', function (e) {
			switch (e.keyCode) {
				case 13:
					e.preventDefault();
					$save.trigger('click');
					break;
				case 27:
					e.preventDefault();
					$cancel.trigger('click');
			}
		}).focus();
	}

	function createNewPost(e) {
		e.preventDefault();
		$(e.target).closest('a').addClass('disabled');
		$.ajax({
			url    : lpFrontendCourseEditorSettings.rootURL + '?lp-ajax=create-new-post',
			data   : $(this).data(),
			success: function (r) {
				r = LP.parseJSON(r);
				if (r.redirect) {
					window.location.href = r.redirect;
				}
			}
		})
	}

	function watchChangePostData() {
		var $form = $('#e-edit-post'),
			data = $form.serialize(),
			changed = false;

		// setInterval(function () {
		//     window.onbeforeunload = $form.serialize() != data ? function () {
		//         return true;
		//     } : null;
		// }, 1000);
		//
		// $form.on('submit', function () {
		//     window.onbeforeunload = null;
		// })
	}

	function removeMessageFromUrl() {
		LP.setUrl(window.location.href.removeQueryVar('updated'))
	}

	var lpFrontendCourseEditorSettings;

	$(document).ready(function () {
		var el_lpFrontendCourseEditorSettings = $('input[name=lpFrontendCourseEditorSettings]');

		if (!el_lpFrontendCourseEditorSettings.length) {
			return;
		}

		var lpFrontendCourseEditorSettings_str = el_lpFrontendCourseEditorSettings.val();

		lpFrontendCourseEditorSettings = JSON.parse(lpFrontendCourseEditorSettings_str);
		el_lpFrontendCourseEditorSettings.val('');

		initColumnCB();
		watchChangePostData();
		removeMessageFromUrl();
	}).on('click', '.e-post-attachment .set-attachment', function (event) {
		event.preventDefault();
		event.stopPropagation();

		wp.media.featuredImage.frame().open();
	}).on('click', '.e-post-attachment .remove-attachment a', function (event) {
		event.preventDefault();
		event.stopPropagation();

		wp.media.featuredImage.remove();
	}).on('click', 'input[name="_lp_course_result"]', function () {
		var a = $('input[name="_lp_course_result"]:checked')
		if (a.val() === 'evaluate_final_quiz') {

		}
	}).on('mouseup', function (e) {
		$('.anim').removeClass('anim')
	})
		.on('click', '.edit-slug', editSlugBox)
		.on('click', '.e-new-post', createNewPost)

	$(document).ajaxComplete(function (event, request, settings) {
		var m = settings.data ? settings.data.match(/action=get-post-thumbnail-html/) : false;
		if (m) {
			var n = settings.data.match(/thumbnail_id=(-?[0-9]+)/),
				thumbnail_id = n ? parseInt(n[1]) : -1;
			$('.post-attachment')
				.html($(request.responseJSON.data).find('img'))
				.parent()
				.toggleClass('has-attachment', thumbnail_id > 0)
				.find('input[name="_thumbnail_id"]').val(thumbnail_id);
		}
	})

})(jQuery);