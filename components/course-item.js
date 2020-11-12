;(function ($) {
    "use strict";
    var courseItemMixin = {
        computed: {
            itemId: function () {
                return this.item.id;
            },
            itemTypes: function () {
                var $vm = this,
                    types = [],
                    supportTypes = this.getItemTypes();

                for (var i = 0, n = supportTypes.length; i < n; i++) {
                    if (supportTypes[i].type === this.item.type) {
                        types.unshift(supportTypes[i]);
                    } else {
                        types.push(supportTypes[i]);
                    }
                }

                return types;
            }
        },
        methods: {
            onFocus: function (e) {
                if (e.type == 'click' && $(e.target).closest('.delete').length) {
                    return;
                }

                if (this.focused) {
                    return;
                }
                this.focused = true;
                this.$emit('onFocusItem', this);
            },
            onBlur: function (e) {
                if (!this.focused) {
                    return;
                }
                this.focused = false;
                //this.$emit('onBlurItem', this);
            },
            remove: function () {
                this.$parent.removeItem(this);
            },
            itemClasses: function () {
                var classes = ['e-section-item', 'e-sort-item', this.item.type, 'placeholder'];

                // if (this.isNew()) {
                //     classes.push('new-item');
                // }
                //
                // if (this.selected) {
                //     classes.push('e-selected');
                // }

                if (this.getItemTypes().length > 2) {
                    classes.push('d23e12fd');
                }

                // if (this.placeholder) {
                //     classes.push('placeholder')
                // }
                //
                // if (this.$root.item && this.$root.item.id === this.itemId) {
                //     classes.push('e-selected')
                // }

                return classes;
            },
            getInputPlaceholderText: function (defaultText) {
                var types = this.$dataStore('course_item_types');

                for (var i = 0, n = types.length; i < n; i++) {
                    if (types[i].type === this.item.type) {
                        return types[i].placeholder || defaultText;
                    }
                }

                return defaultText;
            },
            itemSwitchClass: function (itemType) {
                var cls = [itemType.type, itemType.icon];

                if (itemType.type == this.item.type) {
                    cls.push('current');
                }

                return cls;
            },
            _select: function (e) {
                var kb = FE_Helpers.getKeyboard(e);
                if (kb.ctrl) {
                    this.$emit('select-item', [e, this]);
                } else {
                    this.$emit('deselect-item', [e, this]);
                }
            },
            getItemTypes: function () {
                return this.$root.$store().getters.courseItemTypes;
            },
            isNew: function () {
                return isNaN(this.item.id);
            },
            _switchType: function (e, t) {
                if (this.isNew()) {
                    this.item.type = t;
                }

                this.$('.item-title').focus();
            },
        }
    }
    // Vue.component('e-course-item-new', {
    //     props: ['section', 'item', 'selected', 'position', 'placeholder'],
    //     template: '#tmpl-e-course-item-new',
    //     mixins: [courseItemMixin]
    // })
    Vue.component('e-course-item', {
        template: '#tmpl-e-course-item',
        props: ['section', 'item', 'selected', 'position', 'placeholder'],

        data: function () {
            return {
                id: function () {
                    return this.item.id;
                },
                xxxxx: false,
                focused: 0
            }
        },
        computed: {
            itemId: function () {
                return this.item.id;
            },
            itemTypes: function () {
                var $vm = this,
                    types = [],
                    supportTypes = this.getItemTypes();

                for (var i = 0, n = supportTypes.length; i < n; i++) {
                    if (supportTypes[i].type === this.item.type) {
                        types.unshift(supportTypes[i]);
                    } else {
                        types.push(supportTypes[i]);
                    }
                }

                return types;
            }
        },
        created: function () {
            if (!this.item) {
                this.item = {
                    type: 'lp_lesson',
                    title: ''
                }
            }
        },
        watch: {
            'item.preview': function (v) {
                //this.item.settings['_lp_preview'] = v ? 'yes' : 'no';
            }
        },
        mounted: function () {
            this.$root.addItem(this);
            this.$parent.$parent.$on('pressTitle', this.onPressTitle);
            this.$input = $(this.$el).find('.item-title');
            this.$input.data('$instance', this);
            $(this.$el).data('$instance', this);

            if (this.isNew()) {
                this.focus();
            }

            /*$(this.$el).find('.delete').draggable({
             start: $.proxy(function (e, ui) {
             $(this.$el).addClass('moving')
             }, this),
             helper: 'clone',
             stop: $.proxy(function () {
             $(this.$el).removeClass('moving')
             }, this)
             });*/

            $(this.$el).find('.e-quick-drop > li').droppable({
                drop: function (e, ui) {
                }
            });

            this.watchGeneralChange();

        },
        methods: $.extend({}, FE_Base.Store_Methods, {
            watchGeneralChange: function () {
                var props = ['title', 'content'],
                    i, n = props.length;

                for (i = 0; i < n; i++) {
                    this.$watch('item.' + props[i], (function ($vm, prop) {
                        return function (value) {
                            $vm.updateGeneralProps(prop, value);
                        }
                    })(this, props[i]))
                }
            },
            isNew: function () {
                return isNaN(this.item.id);
            },
            /**
             * Callback handler for watching changes general props of course item
             * such as title, content
             */
            updateGeneralProps: FE_Helpers.debounce(function (prop, value) {
                if (!this.item.id) {
                    return;
                }
                this.$dispatch('updatePost', {
                    post_ID: this.item.id,
                    prop: prop,
                    propContent: value,
                }).then(function (r) {
                    if (r.result === 'success') {

                    }
                });
            }, 300, this),
            onPressTitle: function (e, keyboard) {
                var $el = null;
                if (!$(e.target).is(this.$input)) {
                    return;
                }

                switch (keyboard.code) {
                    case 13:
                        e.preventDefault();

                        if (this.placeholder) {
                            var itemName = this.$('.item-title').val();
                            if (itemName) {
                                this.$parent.addNewItem(99999, {
                                    title: itemName,
                                    type: this.item.type
                                });

                                FE_Helpers.debounce(function ($vm) {
                                    $vm.$().find('.item-title').focus();
                                }, 40)(this);

                                this.item.title = '';
                            }
                        } else {
                            if (keyboard.shift && keyboard.ctrl) {
                                this.$parent.moveNextInput();
                            } else if (keyboard.ctrl) {
                                this.$parent.addNewItem(this);
                            } else {
                                $el = $(this.$el).next().find('.item-title').focus();
                                if ($el.length) {
                                    $el.data('$instance').onFocus();
                                } else {
                                    this.$parent.addNewItem(this);
                                }
                            }
                        }
                        return;
                    case 27:
                        this.remove();
                        break;
                    case 8:
                        $el = $(keyboard.el);
                        if ($el.val() === '') {
                            if (keyboard.countFromEmpty > 1) {
                                $el.data('$instance').remove();
                            }

                        }
                }

                this.onFocus();
            },
            focus: function () {
                var $el = $(this.$el).find('.item-title').focus();

                if ($el.length) {
                    $el.data('$instance').onFocus('focus');
                    return $el;
                }

                return false;
            },
            onFocus: function (e) {
                if (this.focused) {
                    return;
                }
                this.focused = true;
                this.$emit('onFocusItem', this);
                this.$emit('openItemSettings', this);
            },
            onBlur: function (e) {
                if (!this.focused) {
                    return;
                }
                this.focused = false;
                // this.$emit('onBlurItem', this);
            },
            remove: function () {
                this.$parent.removeItem(this);
            },
            itemClasses: function () {
                var classes = ['e-section-item', 'e-sort-item', this.item.type];

                if (this.isNew()) {
                    classes.push('new-item');
                }

                if (this.selected) {
                    classes.push('e-selected');
                }

                if (this.getItemTypes().length > 2) {
                    classes.push('d23e12fd');
                }

                if (this.placeholder) {
                    classes.push('placeholder')
                }

                if (this.$root.item && this.$root.item.id === this.itemId) {
                    classes.push('e-selected')
                }

                return classes;
            },
            getId: function () {
                return this.item.id;
            },
            getItemTypes: function () {
                return this.$root.$store().getters.courseItemTypes;
            },
            itemSwitchClass: function (itemType) {
                var cls = [itemType.type, itemType.icon];

                if (itemType.type == this.item.type) {
                    cls.push('current');
                }

                return cls;
            },
            openSettings: function () {
                this.$emit('openItemSettings', this);
            },
            getPosition: function () {
                var $el = $(this.$el);

                return $el.parent().children().index($el);
            },
            getSection: function () {
                return this.$parent.section;
            },
            supportPreview: function () {
                return $.inArray(this.item.type, this.$dataStore().supports['preview']) !== -1;
            },
            countQuestions: function () {
                return this.item.questions ? this.item.questions.length : 0;
            },
            getInputPlaceholderText: function (defaultText) {
                var types = this.$dataStore('course_item_types');

                for (var i = 0, n = types.length; i < n; i++) {
                    if (types[i].type === this.item.type) {
                        return types[i].placeholder || defaultText;
                    }
                }

                return defaultText;
            },
            _switchType: function (e, t) {
                if (this.isNew()) {
                    this.item.type = t;
                }

                this.$('.item-title').focus();
            },
            _move: function (e, dir) {
                var kb = FE_Helpers.getKeyboard(e);
                if (kb.button !== 'left') {
                    return;
                }

                var end = false;
                // Hold mouse down more than 1 second, then toggle all sections
                if ($(e.target).data('mouse_hold_time') > 1100) {
                    end = true;
                } else {
                }

                this.$emit('move-item', [this, dir, end]);
            },
            _startAnim: function (e, dir) {
                var kb = FE_Helpers.getKeyboard(e);
                if (kb.button !== 'left') {
                    return;
                }

                $(e.target).addClass('anim');
            },
            _delete: function (e) {
                var kb = FE_Helpers.getKeyboard(e);
                if (kb.button !== 'left') {
                    return;
                }

                var trash = false;
                // Hold mouse down more than 1 second, then toggle all sections
                if ($(e.target).data('mouse_hold_time') > 1100) {
                    trash = true;
                } else {
                }

                this.$emit('delete-item', [this.item.id, trash, this]);
            },
            _stopAnim: function (e, dir) {
                var kb = FE_Helpers.getKeyboard(e);
                if (kb.button !== 'left') {
                    return;
                }

                $(e.target).removeClass('anim');
            },
            _toggleMoreTypes: function (e, inOut) {
                if (inOut == 'out') {
                    FE_Helpers.debounce(function ($vm) {
                        $($vm.$el).removeClass('show-more-types');
                    }, 2000)(this);
                } else {
                    $(this.$el).toggleClass('show-more-types');
                }
            },
            _select: function (e) {
                var kb = FE_Helpers.getKeyboard(e);
                if (kb.ctrl) {
                    this.$emit('select-item', [e, this]);
                } else {
                    this.$emit('deselect-item', [e, this]);
                }
            },
            _removeSelected: function (e, item_ID) {
                this.$emit('select-item', [e, this]);
            },
            _addItems: function (e) {
                var select = false;
                // Hold mouse down more than 1 second, then toggle all sections
                if ($(e.target).data('mouse_hold_time') > 1100) {
                    select = true;
                }

                if (select) {
                    this.$emit('add-items', [e, this]);
                } else {
                    this.$parent.addNewItem(this);
                }
            },
            _preview: function () {
                this.item.settings['_lp_preview'] = this.item.settings['_lp_preview'] === 'yes' ? 'no' : 'yes';

                this.$dispatch('toggleItemPreview', {
                    item_ID: this.item.id,
                    isPreview: this.item.settings['_lp_preview']
                });
            }
        })
    })

})(jQuery);