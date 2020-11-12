/**
 * VueX Store for course editor
 *
 * @author ThimPress
 * @package CourseEditor/JS
 * @version 3.0.0
 */
;(function ($) {
	/**
	 * Sections Store.
	 *
	 * @since 3.0.0
	 */
	var Store = function (Data_Store) {
		//Store.State = JSON.parse(JSON.stringify(Data_Store));
		Store.State = Data_Store;

		return new Vuex.Store({
			namespaced: true,
			state     : Store.State,
			getters   : Store.Getters,
			mutations : Store.Mutations,
			actions   : Store.Actions,
			modules   : {
				section: FE_Section_Store({})
			}
		});
	};

	Store.Getters = {
		course_ID      : function (state) {
			return state.course_ID;
		},
		item_Id        : function (state) {
			return state.item_ID;
		},
		courseItemTypes: function (state) {
			return state.course_item_types;
		},
		active_tab     : function (state) {
			return state.active_tab;
		},
		sections       : function (state) {
			return state.sections;
		},
		countItems     : function (state) {
			var count = 0;
			$.each(state.sections, function () {
				count += this.items.length;
			});

			return count;
		},
		identify       : function (state) {
			return state.identify;
		},
		questionFields : function (state) {
			return state.post_type_fields['lp_question'];
		},
		settings       : function (state) {
			return state.settings;
		},
		all            : function (state) {
			return state;
		}
	};

	Store.Mutations = {
		updateItemsOrder: function (state, data) {
			state.section.items = data.items;
		},
		deleteItem      : function (state, args) {
			if (undefined != args.code && args.code == 1 && undefined != args.data) {
				var data = args.data;

				var item_ID = data.item_ID,
					section_ID = data.section_ID,
					sectionIndex = state.sections.findIndex(function (a) {
						return a.id == section_ID;
					}),
					section = state.sections[sectionIndex];

				if (section && section.items) {
					if (!$.isArray(item_ID)) {
						item_ID = [item_ID];
					}

					for (var _i = 0, _n = item_ID.length; _i < _n; _i++) {
						var _item_ID = item_ID[_i],
							itemIndex = section.items.findIndex(function (a) {
								return a.id == _item_ID;
							});

						if (itemIndex > -1) {
							section.items.splice(itemIndex, 1);
						}
					}
				}
			}
		},
		removeSection   : function (state, args) {
			var section_ID = args.section_ID,
				sectionIndex = state.sections.findIndex(function (a) {
					return a.id == section_ID;
				});

			if (sectionIndex !== -1) {
				state.sections.splice(sectionIndex, 1);
			}
		},
		newRequest      : function () {
		},
		requestComplete : function () {

		}
	};

	Store.Actions = {
		removeSection       : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'remove-section', FE_Helpers.omitObjects(data)).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				})
			});
		},
		updateSection       : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-section', FE_Helpers.omitObjects(data)).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				})
			});
		},
		updateItemsOrder    : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-items-order', {
					section_ID: data.section_ID,
					items     : data.items.listPluck('id'),
					__activity: true
				}).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				})
			});
		},
		updateSectionsOrder : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-sections-order', {
					sections  : data.sections.listPluck('id'),
					__activity: true
				}).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				})
			});
		},
		updateHiddenSections: function (context, hidden) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-hidden-sections', {
					sections: hidden
				}).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				})
			});
		},
		deleteItem          : function (context, args) {
			$vm = this;
			var item_ID = args.item_ID,
				section_ID = args.section_ID;

			var data = {
				section_ID: section_ID,
				item_ID   : item_ID,
				trash     : args.trash,
				__activity: true
			};

			FE_Helpers.Course_Editor_Request('', 'delete-course-item', data).then(function (r) {
				context.commit('deleteItem', r);
			}, function (r) {
				reject(r)
			})
		},
		addNewItem          : function (context, args) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'add-course-item', {
					section_ID: args.section_ID,
					item      : args.item,
					position  : args.position,
					__activity: true
				}).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},
		addItem             : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'add-course-items', $.extend({
					__activity: true
				}, {}, data)).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},
		toggleItemPreview   : function (context, data) {
			FE_Helpers.Course_Editor_Request('', 'toggle-item-preview', $.extend({
				__activity: true
			}, {}, data))
		},
		updateQuestion      : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-question', $.extend({
					__activity: true
				}, {}, data)).then(function (r) {
					resolve(r);
				}, function (r) {
				});
			});
		},
		changeQuestionType  : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-question', $.extend({
					context: 'change-type', __activity: true
				}, data)).then(function (r) {
					resolve(r);
				}, function (r) {
					resolve(r);
				});
			});
		},
		updateQuestionsOrder: function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-questions-order', $.extend({
					__activity: true
				}, data)).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},
		addQuestions        : function (context, data) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'add-questions', $.extend({
					__activity: true
				}, data)).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},
		queryItems          : function (context, args) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'modal-query-items', $.extend({}, {}, args)).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},
		updateSectionTitle  : function (context, args) {
			FE_Helpers.Course_Editor_Request('', 'update-section-title', args);
		},
		/**
		 * Remove question from quiz.
		 *
		 * @param context
		 * @param {Object} args
		 * {
		 *      quiz_ID: Id of quiz that contains question,
		 *      question_ID: Id of question to remove,
		 *      trash: Move question to trash or not
		 * }
		 *
		 * @return {Promise}
		 */
		removeQuestion      : function (context, args) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'remove-question', {
					quiz_ID    : args.quiz_ID,
					question_ID: args.question_ID,
					trash      : args.trash,
					__activity : true
				}).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},

		/**
		 * Update question settings.
		 *
		 * @param context
		 * @param args
		 */
		updateQuestionSettings: function (context, args) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-question-settings', {
					question_ID: args.question_ID,
					settings   : args.settings,
					__activity : true
				}).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},
		updatePost            : function (context, args) {
			return new Promise(function (resolve, reject) {
				FE_Helpers.Course_Editor_Request('', 'update-post', {
					post_ID    : args.post_ID,
					prop       : args.prop,
					propContent: args.propContent,
					__activity : true
				}).then(function (r) {
					resolve(r);
				}, function (r) {
					reject(r)
				});
			});
		},
		newRequest            : function (context, data) {
			$(document).trigger('FE.request-start', data);
		},
		requestComplete       : function (context, data) {
			$(document).trigger('FE.request-completed', data);
		},
		_blockContent         : FE_Helpers.debounce(function () {
			$('#frontend-editor').addClass('ajaxloading');
		}, 0),
		_unblockContent       : FE_Helpers.debounce(function () {
			$('#frontend-editor').removeClass('ajaxloading');
		}, 300)
	};

	var FE_Course_Editor_Localize = (function (i18n) {
		var state = FE_Helpers.clone(i18n);

		var getters = {
			all: function (state) {
				return state;
			}
		};
		return {
			namespaced: true,
			state     : state,
			getters   : getters
		};

	});

	function _Promise(a) {
		return new Promise(function (resolve, reject) {

		});
	}

	Object.defineProperty(Array.prototype, 'removeElementByField', {
		value: function (field, value) {

		}
	});

	$(document).ready(function () {
		Store.Modules = {
			section: FE_Section_Store
		}

		var el_lpFrontendCourseEditorSettings = $('input[name=lpFrontendCourseEditorSettings]');

		if (!el_lpFrontendCourseEditorSettings.length) {
			return;
		}

		var lpFrontendCourseEditorSettings_str = el_lpFrontendCourseEditorSettings.val();
		var lpFrontendCourseEditorSettings = JSON.parse(lpFrontendCourseEditorSettings_str);
		// el_lpFrontendCourseEditorSettings.val('');

		window.FE_Course_Store = Store(lpFrontendCourseEditorSettings.Course_Store_Data);

		window.FE_Localize = new (function () {
			var $store = new Vuex.Store(FE_Course_Editor_Localize(lpFrontendCourseEditorSettings.i18n));
			this.get = function (tag) {
				var text = $store.getters['all'][tag];

				if (text === undefined) {
					text = tag
				}

				return text;
			}
		});
	});

})(jQuery);