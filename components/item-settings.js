;(function ($) {
    "use strict";

    Vue.component('e-course-item-settings', {
        template: '#tmpl-e-course-item-settings',
        props: ['section', 'item', 'itemData', 'request', 'content'],
        data: function () {
            return {
                dataChanged: false,
                $prevItem: false,
                $nextItem: false
            }
        },
        watch: {
            itemData: {
                handler: function (v) {
                    var vm = this;
                    vm.dataChanged = true;
                    Vue.nextTick(function () {
                        vm.dataChanged = false;
                    });

                    return v;
                }, deep: true
            },
            'itemData.id': function () {
                $(this.$el).removeAttr('class').scrollTop(0);
            },
            'itemData.settings': {
                handler: function (settings) {
                    this.updateItemSettings();
                },
                deep: true
            }
        },
        computed: {
            // itemData: function () {
            //     return this.item.item || {};
            // },
            title: function () {
                return this.item.title;
            },

        },
        created: function () {
        },
        mounted: function () {
            this._mounted = true;
            return;
            this.getNavItems();
            var prop;
            for (prop in this.itemData) {
                if (!this.itemData.hasOwnProperty(prop)) {
                    continue;
                }


            }
        },
        methods: $.extend({}, FE_Base.Store_Methods, {
            /**
             * Update item settings to DB
             */
            updateItemSettings: FE_Helpers.debounce(function () {
                //FE_Helpers.startActivity();
                FE_Helpers.Course_Editor_Request('', 'update-post-meta', {
                    postMeta: this.itemData.settings,
                    post_ID: this.itemData.id
                }).then(function (res) {
                    //FE_Helpers.stopActivity();
                })
            }, 300, this),
            getContext: function () {
                return this.itemData ? this.itemData.type : '';
            },
            hasPrevItem: function () {
                this.getNavItems();
                return this.$prevItem;
            },
            hasNextItem: function () {
                this.getNavItems();
                return this.$nextItem;
            },
            close: function (e) {
                e.preventDefault();
                this.$emit('closeItemSettings', this);
                this.$parent.closeItemSettings();
            },
            getNavItems: function () {
                if (!this.item) {
                    return;
                }
                return;
                var $els = $('#e-course-curriculum').find('.e-section-item:not(.placeholder)').find('.item-title'),
                    index = $els.index(this.item.$('.item-title')),
                    $next = false,
                    $prev = false;


                if (index < $els.length - 1) {
                    $next = $els.eq(index + 1).data('$instance');
                }
                if (index > 0) {
                    $prev = $els.eq(index - 1).data('$instance');
                }

                if ($prev) {
                    this.$prevItem = $prev;
                } else {
                    this.$prevItem = false;
                }

                if ($next) {
                    this.$nextItem = $next;
                } else {
                    this.$nextItem = false;
                }

            },
            getNavItemText: function (nav) {
                if (nav === 'prev' && this.$prevItem) {
                    return this.$prevItem.item.title;
                } else if (this.$nextItem) {
                    return this.$nextItem.item.title;
                }

                return false;
            },
            getItemName: function () {
                var $vm = this,
                    t = this.$dataStore('course_item_types').find(function (a) {
                        return a.type == $vm.itemData.type;
                    });

                return t ? t.name : this.itemData.id;
            },
            nextItem: function () {

                if (this.$nextItem) {
                    this.item = this.$nextItem;
                    this.itemData = this.item.item;
                }
                this.getNavItems();
            },
            prevItem: function () {
                if (this.$prevItem) {
                    this.item = this.$prevItem;
                    this.itemData = this.item.item;
                }
                this.getNavItems();
            },
            getComponentItemSettings: function () {
                return 'e-item-settings-' + this.itemData.type;
            },
            update: function (callback) {
                var section = this.item.getSection();
                this.request('', 'update-item-settings', {
                    section_ID: section.id,
                    item_ID: this.itemData.id,
                    settings: this.getItemSettings(),
                    position: this.item.getPosition() + 1
                }).then($.proxy(function (response) {
                    this.updateComplete(response);
                    $.isFunction(callback) && callback.apply(this, response);
                }, this));
            },
            apply: function (i) {
            },
            updateComplete: function (response) {
                var data = response || {};

                if (data.result === 'error') {
                    return;
                }

                this.itemData.id = data.item.id;
            },
            getFormattedId: function () {
                return this.itemData.id ? '#' + this.itemData.id : '#####';
            },
            getItemSettings: function () {
                var settings = FE_Helpers.clone(this.itemData.settings) || {};
                delete settings['__FIELDS__'];

                settings.__title = this.itemData.title;
                settings.__content = this.itemData.content;
                settings.__type = this.itemData.type;

                var filteredSettings = $(document).triggerHandler('e-item-settings', settings);

                return settings;
            },
            enableGeneralSettings: function () {
                return this.itemData.type !== 'lp_quiz';
            },
            _updateSettings: function () {

            }
        })
    });

    Vue.component('e-form-field', {
        props: ['field', 'item', 'itemData', 'settings'],
        template: '#tmpl-e-form-field',
        computed: {},
        methods: {
            includeFormField: function (field) {
                field = field || this.field;

                var maps = {
                    number: 'text'
                }, slug = field.type.replace(/_/, '-');

                if (maps[slug]) {
                    field.xType = slug;
                    field.type = maps[slug];
                } else {
                    field.type = slug;
                }
                return 'e-form-field-' + field.type
            }
        }
    });

    var __X = $.extend({}, FE_Base.Store_Methods, {
        loadSettings: function (callback) {
            var that = this;
            return;
            //if ($.isEmptyObject(this.item.item.settings)) {
            this.request('', 'load-item-settings', {
                item_ID: this.itemData.id,
                item_type: this.itemData.type
            }).then(function (response) {
                $.isFunction(callback) && callback.apply(that, [response])
            });
            // }
        },
        includeFormField: function (field) {
            var maps = {
                number: 'text'
            }, slug = field.type.replace(/_/, '-');

            if (maps[slug]) {
                field.xType = slug;
                field.type = maps[slug];
            } else {
                field.type = slug;
            }
            return 'e-form-field-' + field.type
        },
        redraw: function () {
            var vm = this;
            vm.drawComponent = false;
            Vue.nextTick(function () {
                vm.drawComponent = true;
            });
        },

        vueId: function () {
            return this._uid
        },

        getSettings: function (key) {
            return key && this.itemData.settings ? this.itemData.settings[key] : this.itemData.settings;
        },

        getFields: function (type) {
            var $postTypeFields = this.$dataStore().post_type_fields;

            return $postTypeFields[type];
        },

        loadSettingsCallback: function (response) {
            var content = response.__CONTENT__;

            delete response['__CONTENT__'];

            this.itemData.settings = response;
            this.itemData.content = content;

        },

        isEmptySettings: function () {
            var s = this.itemData.settings;
            return !s || ($.isPlainObject(s) && $.isEmptyObject(s)) || ($.isArray(s) && s.length === 0);
        }
    });

    var __Y = {
        template: '#tmpl-e-course-item-settings-lp_lesson',
        props: ['item', 'itemData', 'request'],
        data: function () {
            return {
                drawComponent: true,
                settings: this.itemData.settings || {}
            }
        },
        computed: {
            settings: function () {
                return this.itemData.settings || {};
            }
        },
        watch: {
            // itemData: {
            //     handler: function (val) {
            //         console.log('Load Settings');
            //
            //         if (this.isEmptySettings()) {
            //             setTimeout(function ($i) {
            //                 $i.loadSettings($i.loadSettingsCallback);
            //                 $i.redraw();
            //             }, 70, this);
            //         } else {
            //             this.redraw();
            //         }
            //         return val;
            //     },
            //     deep: true
            // },
            'itemData.id': function () {
                this.redraw();
            }
        },

        created: function () {
            this.loadSettings(this.loadSettingsCallback);
        },
        methods: $.extend({}, __X, {})
    }

    // Quiz
    var __Z = $.extend({}, __Y, {template: '#tmpl-e-course-item-settings-lp_quiz', 'name': 'e-item-settings-lp_quiz'});

    Vue.component('e-item-settings-lp_lesson', __Y);

    __Z.watch = $.extend(__Z.watch || {}, {
        'question.id': function (v) {
            if (v) {
                var $itemSettings = $(this.$el).addClass('is-showing-question').closest('#e-item-settings').addClass('editing-question');
                this.$nextTick(function () {
                    $(this.$el).find('.e-edit-question-form').css({
                        'top': $itemSettings.scrollTop(),
                        height: $itemSettings.height()
                    })
                })

            } else {
                $(this.$el).removeClass('is-showing-question').closest('#e-item-settings').removeClass('editing-question');
                $(this.$el).find('.e-edit-question-form').css('top', '')
            }
        },
        'itemData.id': function (v) {
            this.redraw();
        }
    })

    __Z.data = function () {
        return {
            drawComponent: true,
            currentTab: 'settings',
            settings: this.itemData.settings || {},
            question: null,
            xTitle: '',
            showSettingsBox: false
        }
    };

    __Z.computed = {
        settings: function () {
            return this.itemData.settings || {};
        },
        xTitle: function () {
            return this.question ? this.question.title : '';
        }
    }

    __Z.mounted = function () {

        var $vm = this;
        $(window).on('resize.resize-question-editor', FE_Helpers.debounce(function () {

            if (!$vm.question || !$vm.question.id) {
                return;
            }

            var $itemSettings = $($vm.$el).closest('#e-item-settings');
            $($vm.$el).find('.e-edit-question-form').css({
                'top': $itemSettings.scrollTop(),
                height: $itemSettings.height()
            })

        }, 300, this));

        // $(document).on('LP.open-item-settings', function (e, url, item) {
        //     if (item && $vm.item.id == item.id) {
        //
        //         var questionId = window.location.href.getQueryVar('question');
        //         console.log(window.location.href, questionId, item, $vm.item);
        //
        //         if (questionId) {
        //             $vm._setEditQuestion(questionId);
        //             return false;
        //         }
        //     }
        //
        //
        //     return url;
        // }).on('LP.close-item-settings', function (e, item) {
        //     if (item && $vm.item.id == item.id) {
        //         $vm.$nextTick(function () {
        //             $vm.question = false;
        //         })
        //         //$vm._closeQuestion();
        //     }
        // });

    };

    __Z.methods = $.extend(__Z.methods, {
        selectTab: function (e) {
            e.preventDefault();
            var tab = $(e.target).attr('data-tab');
            if (tab) {
                this.currentTab = tab;
                this.xTitle = '';
            }
        },
        isCurrent: function (tab) {
            return this.currentTab === tab;
        },
        getTabTitle: function (tab) {
            if (tab.id !== 'questions' || !this.isCurrent(tab.id)) {
                return tab.title;
            }

            return this.xTitle
        },
        isVisibleTab: function (tab) {
            if (tab.id !== 'questions') {
                return true;
            }

            return !this.xTitle;
        },
        _setEditQuestion: function (question) {

            if (!isNaN(question)) {
                question = this.itemData.questions ? this.itemData.questions.find(function (q) {
                    return q.id == question;
                }) : null;
            }

            if (!question) {
                return;
            }

            this.question = question;
            //FE_Helpers.setQueryVar('question', question.id);
            this.xTitle = question ? question.title : null;
        },
        isEditingQuestion: function () {
            return this.question;
        },
        _closeQuestion: function (e) {
            if (e) e.preventDefault();
            this.question = false;
            FE_Helpers.removeQueryVar('question');
        },
        updateQuestion: function () {

        },
        _updateSettings: function () {
        },
        loadQuestion: function (id, r) {
            if (r === 'position') {
                this._setEditQuestion(this.itemData.questions[id]);

            }
            $(this.$el).find('.e-edit-question-form').scrollTop(0);
        }
    });

    Vue.component('e-item-settings-lp_quiz', __Z);

    Vue.component('e-item-settings-general', {
        template: '#tmpl-e-course-item-settings-basic',
        props: ['item', 'itemData', 'request'],
        watch: {
            itemData: function () {
            }
        }
    });


})(jQuery);