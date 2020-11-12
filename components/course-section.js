;(function ($) {
    'use strict';

    /**
     * Vue course section mixin
     *
     * @type {{props: [*], methods: {sectionClasses: sectionClasses, _onKeyPress: _onKeyPress}}}
     */
    var courseSectionMixin = {}
    Vue.component('e-course-section-new', {
        template: '#tmpl-e-course-section-new',
        props: ['sections'],
        data: function () {
            return {
                section: {
                    title: '',
                    description: '',
                    items: []
                }
            }
        },
        watch: {},
        methods: {
            /**
             * Section classes for css
             *
             * @returns {[string]}
             */
            sectionClasses: function () {
                var classes = ['e-section new-section placeholder'];
                return classes;
            },
            /**
             * Event handler for keyboard when pressing on section title input.
             *
             * @param e
             * @private
             */
            _onKeyPress: function (e) {
                var $vm = this;
                // Add new section if enter is pressed
                if (e.keyCode == 13) {
                    e.preventDefault();

                    var newSection = $.extend({}, this.section);
                    newSection.items = [];
                    this.sections.push(newSection);

                    Vue.nextTick(function () {
                        // Reset
                        this.section.title = '';
                        this.section.description = '';

                        $(this.$refs.sectionTitle).focus();
                    }, this)
                }
            }
        }
    });

    Vue.component('e-course-section', {
        template: '#tmpl-e-course-section',
        props: ['section', 'placeholder'],
        data: function () {
            return {
                oldDesc: '',
                selectedItems: [],
                status: '',
                defaultItem: {
                    type: 'lp_lesson'
                }
            }
        },
        $input: null,
        watch: {
            'section.title': function (v) {
                this.updateSectionTitle();
            }
        },
        computed: {
            // countItems: function () {
            //     return 10;
            // }
            items: function () {
                return this.section.items || [];
            },
            sortedItems: function () {
                return this.section.items || [];
            },
            itemIds: function () {

            },
            countItems: function () {
                return this.items.length;
            }
        },
        mounted: function () {
            this.$parent.$on('pressTitle', this.onPressTitle);
            this.$input = $(this.$el).find('.section-title');
            this.$input.data('$instance', this);
            this.$item = null;

            if (this.isNew()) {
                this.focus();
            }

            $(this.$el).find('.e-section-content').sortable({
                axis: 'y',
                handle: '.sort svg',
                connectWith: '.e-section-content',
                items: '.e-section-item:not(.placeholder)',
                start: $.proxy(this._startSort, this),
                update: $.proxy(this._updateSortable, this)
            });

            window.$section = this;

            if (isNaN(this.section.id)) {
                this.update('title')
            }
        },
        methods: $.extend({
            /**
             * Update title of section when it changes
             */
            updateSectionTitle: FE_Helpers.debounce(function () {
                this.$dispatch('updateSectionTitle', {
                    section_ID: this.section.id,
                    title: this.section.title
                });
            }, 500),
            onPressTitle: function (e, keyboard) {
                if (!$(e.target).is(this.$input)) {
                    return;
                }
                if (keyboard.code === 13) {
                    e.preventDefault();

                    if (this.placeholder) {
                        var sectionName = $(this.$el).find('.section-title').val();
                        if (sectionName.length) {
                            this.$parent.addNewSection(-1, {
                                title: sectionName
                            }).then(function ($section) {
                                if ($section) {
                                    $section.update('title');
                                }
                            });

                            FE_Helpers.debounce(function ($vm) {
                                $vm.$parent.moveNextInput();
                            }, 100)(this);
                        }
                    } else {

                        if (keyboard.ctrl) {
                            var $el = $(this.$el).find('.item-title').first().focus();
                            if (!$el.length) {
                                this.addNewItem();
                            }
                        } else {
                            this.$parent.moveNextInput();
                        }
                    }
                    return;
                }

                this.onFocus();
            },
            test: function () {
                return 456
            },
            onFocus: function () {
                if (this.focused) {
                    return;
                }
                this.focused = true;
                this.$emit('onFocusSection', this);
            },
            onBlur: function () {
                if (!this.focused) {
                    return;
                }
                this.focused = false;
                this.$emit('onBlurSection', this);
            },
            onFocusItem: function ($item) {
                this.$item = $item;
                var $thisTitle = $($item.$el).find('.item-title');
                $('.item-title').not($thisTitle).each(function () {
                    var $s = $(this).data('$instance');
                    $s.onBlur(123);
                })
            },
            onBlurItem: function ($item) {
                // if (!this.maybeUpdateItem($item)) {
                //     if ($item.isNew()) {
                //         this.removeItem($item);
                //     }
                // }
            },
            moveNextInput: function () {
                var $nextEl = $(this.$el).next().find('.section-title').focus();
                if ($nextEl.length) {
                    $nextEl.data('$instance').onFocus();
                } else {
                    this.$parent.addNewSection(this)
                }
            },
            focus: function () {
                var $el = $(this.$el).find('.section-title').focus();
                if ($el.length) {
                    $el.data('$instance').onFocus();
                    return $el;
                }

                return false;
            },
            sectionClasses: function () {
                var classes = ['e-section'];

                if (this.isNew()) {
                    classes.push('new-section')
                }

                if (this.isHidden()) {
                    classes.push('closed');
                }

                if (this.placeholder) {
                    classes.push('placeholder');
                }

                if (this.status) {
                    classes.push(this.status);
                }

                return classes;
            },
            isHidden: function () {
                return $.inArray(this.getId() + "", this.$dataStore().admin_hidden_sections) !== -1;
            },
            getId: function () {
                return this.section.id;
            },

            /**
             * Add items selected from modal.
             *
             * @param item Array|Object
             * @param $ref Object. Vue model
             */
            addItem: function (item, $ref) {
                var position = this.items.length,
                    itemData = null;

                if ($ref !== undefined && $ref !== null) {
                    position = !isNaN($ref) ? $ref : this.getItemPosition($ref) + 1;
                }

                if ($.isArray(item)) {
                    for (var n = item.length, i = n - 1; i >= 0; i--) {
                        itemData = item[i];

                        this.section.items.splice(position, 0, itemData);
                    }
                } else {
                    this.section.items.splice(position, 0, item);

                    item = [item];
                }

                this.$dispatch('addItem', {
                    section_ID: this.section.id,
                    items: item.listPluck('id'),
                    position: position
                });
            },
            addNewItem: function ($ref, item) {
                var type = this.$dataStore('default_course_item'),
                    position = this.items.length,
                    newId = LP.uniqueId(),
                    itemData = $.extend({}, {
                        id: newId,
                        type: type,
                        title: '',
                        settings: this.getDefaultItemSettings(type)
                    }, item || {});

                switch (type) {
                    case 'lp_quiz':
                        itemData.questions = [];
                }
                //this.getDefaultItemSettings(type)

                if ($ref) {
                    position = isNaN($ref) ? this.getItemPosition($ref) + 1 : $ref;
                }

                this.section.items.splice(position, 0, itemData);

                FE_Helpers.debounce(function ($vm) {
                    var $ins = $('[data-id="' + newId + '"]').data('$instance');
                    //$ins.focus();
                    $vm.maybeUpdateItem($ins);
                }, 30)(this);

                this.$emit('added-item', itemData, this);

                return !!itemData.title.length;
            },
            maybeUpdateItem: function ($item) {
                var $vm = this,
                    itemData = FE_Helpers.clone($item.item),
                    position = this.getItemPosition($item);
                itemData.position = position + 1;

                itemData.title.length && this.$dispatch('addNewItem', {
                    section_ID: this.section.id,
                    item: itemData
                }).then($.proxy(function (r) {
                    if (r.new_item) {
                        $item.item.id = r.new_item.id;
                        LP.setUrl($vm.$dataStore('coursePermalink') + '/' + $item.item.id + '/');
                    }
                }, this));

                return itemData.title.length;
            },
            getItemPosition: function ($item) {
                var position = -1;

                if ($item) {
                    for (var i in this.section.items) {
                        if (this.section.items[i].id == $item.getId()) {
                            position = parseInt(i);
                            break;
                        }
                    }
                }
                return position;
            },
            defaultType: function () {
                return this.$dataStore('default_course_item');
            },
            getItemIds: function () {
                var ids = [];

                $.map(this.section.items, function (a) {
                    ids.push(a.id);
                });

                return ids;
            },
            removeItem: function (item) {
                var id = '';
                if ($.isPlainObject(item)) {
                    id = item.id;
                } else if (item.getId) {
                    id = item.getId();
                } else {
                    id = item;
                }

                $.each(this.section.items, $.proxy(function (a, b) {
                    if (b.id == id) {
                        this.section.items.splice(a, 1);
                        return false;
                    }
                }, this));
            },
            isNew: function () {
                return isNaN(this.section.id);
            },
            openItemSettings: function ($item) {
                this.$emit('openItemSettings', $item, this)
            },
            getPosition: function () {
                return $(this.$el).parent().children().index(this.$el);
            },
            update: function (context) {
                this.status = 'updating';

                this.$store().dispatch('updateSection', {
                    section: this.section,
                    context: context
                }).then($.proxy(function (r) {
                    if (r.section_id !== this.section.id) {
                        this.section.id = r.section_id;
                    }
                    this.status = '';
                }, this));
            },
            updateItemsOrderFromView: function ($items) {

                if (!$items) {
                    $items = $(this.$el).find('.e-section-item');
                }

                this.section.items = FE_Helpers.sortArrayByDOM(this.section.items, '', 'id', $items);
                this.$store().dispatch('updateItemsOrder', {
                    items: this.section.items,
                    section_ID: this.section.id
                });
            },
            isSelectedItem: function (itemID) {
                return this.selectedItems.findIndex(function (a) {
                    return a == itemID;
                });
            },
            getItemIdsFromView: function () {
                return $(this.$el).find('.e-section-content').children().map(function () {
                    return $(this).attr('data-id');
                }).get();
            },
            getRemovedItems: function () {
                var itemIds = this.getItemIdsFromView(),
                    removedIds = this.section.items.listPluck('id').diffArray(itemIds),
                    i, n, id, items = [];

                for (i = 0, n = removedIds.length; i < n; i++) {
                    id = removedIds[i];
                    items.push({
                        id: removedIds[i],
                        position: this.section.items.findIndex(function (a) {
                            return a.id == id
                        })
                    });
                }

                return items;
            },
            getAddedItems: function () {
                var itemIds = this.getItemIdsFromView(),
                    addedIds = itemIds.diffArray(this.section.items.listPluck('id')),
                    i, n, id, items = [];

                for (i = 0, n = addedIds.length; i < n; i++) {
                    id = addedIds[i];
                    items.push({
                        id: addedIds[i],
                        position: itemIds.findIndex(function (a) {
                            return a == id;
                        })
                    });
                }

                return items;
            },
            _set: function () {

            },
            _toggle: function (e) {
                var $section = $(this.$el),
                    isVisible = !$section.hasClass('closed');

                // Hold mouse down more than 1 second, then toggle all sections
                if ($(e.target).data('mouse_hold_time') > 1100) {
                    $section.parent().children().toggleClass('closed', isVisible);
                } else {
                    $section.toggleClass('closed');
                }

                this.$emit('toggle-sections', this);
            },
            _toggleDesc: function () {
                var isOpen = $(this.$el).toggleClass('e-editing-content').hasClass('e-editing-content');//find('.e-section-desc').is(':visible');

                if (isOpen) {
                    this.oldDesc = this.section.description;
                } else {
                    this._discardChangeDesc();
                }
            },
            _saveDesc: function (e) {
                e.preventDefault();
                this.$().removeClass('e-editing-content');
                this.$root.$request('', 'update-course-section', {
                    section_ID: this.section.id,
                    section_description: this.section.description
                })
            },
            _discardChangeDesc: function (e) {
                e && e.preventDefault();
                this.section.description = this.oldDesc;
                this.$().removeClass('e-editing-content');
            },
            _move: function (e, dir) {
                var end = false;
                // Hold mouse down more than 1 second, then toggle all sections
                if ($(e.target).data('mouse_hold_time') > 1100) {
                    end = true;
                } else {
                }
                this.$emit('move-section', [this, dir, end])
            },
            _moveItem: function (data) {
                var $vm = data[0],
                    dir = data[1],
                    $item = $(this.$el).find('.e-section-item[data-id="' + $vm.item.id + '"]'),
                    $items = $item.parent().children(),
                    $anchor = null;

                if (dir === 'up') {
                    if (data[2]) {
                        $anchor = $items.first();
                    } else {
                        $anchor = $item.prev();
                    }
                } else {
                    if (data[2]) {
                        $anchor = $items.last();
                    } else {
                        $anchor = $item.next();
                    }
                }

                if (!$anchor.length) {
                    return;
                }

                if (dir === 'up') {
                    $item.insertBefore($anchor);
                } else {
                    $item.insertAfter($anchor);
                }

                this.updateItemsOrderFromView($item.parent().children());
            },
            _startSort: function (e, ui) {
                ui.item.data('$parent', e.target);
            },
            _updateSortable: function (e, ui) {
                // this.updateItemsOrderFromView();
                // return;
                if (!this.$dataStore('tempSections')) {
                    this.$dataStore('tempSections', [-1, -1]);
                }

                if (ui.sender) {
                    // add
                    this.$dataStore('tempSections')[1] = this;
                } else {
                    // remove
                    this.$dataStore('tempSections')[0] = this;
                }

                this._updateTowSections();
                return;
                if (!$(e.target).is(ui.item.data('$parent'))) {
                    var itemIds = $(e.target).children().map(function () {
                        return $(this).attr('data-id')
                    }).get();

                    if (ui.sender) {
                        var addedIds = itemIds.diffArray(this.section.items.listPluck('id')),
                            newItems = this.$dataStore('tempSections'),
                            addIndex = itemIds.findIndex(function (a) {
                                return a == addedIds[0];
                            });

                        if (newItems && newItems.length) {
                            //this.section.items.splice(addIndex, 0, newItems[0]);
                            this.addItem(newItems[0], addIndex)
                        }

                    } else {
                        var removeIds = this.section.items.listPluck('id').diffArray(itemIds),
                            removeIndex = this.section.items.findIndex(function (a) {
                                return a.id == removeIds[0]
                            });

                        this.$dataStore('tempSections', this.section.items.splice(removeIndex, 1));
                        this._deleteItem([removeIds[0]]);
                    }
                } else {
                    this.updateItemsOrderFromView($(e.target).children());
                }
            },
            _updateTowSections: FE_Helpers.debounce(function ($vm) {
                var sections = this.$dataStore('tempSections');

                if (sections[0] !== -1 && sections[1] === -1) {
                    sections[0].updateItemsOrderFromView();
                } else if (sections[0] !== -1 && sections[1] !== -1) {

                    var $vm0 = sections[0],
                        $vm1 = sections[1],
                        i, j, n, m,
                        removeItem = $vm0.getRemovedItems(),
                        addItem = $vm1.getAddedItems(),
                        item = null;
                    for (i = 0, n = removeItem.length; i < n; i++) {
                        item = $vm0.section.items[removeItem[i].position];///.splice(removeItem[i].position, 1);
                        for (j = 0, m = addItem.length; j < m; j++) {
                            if (addItem[j].id == removeItem[i].id) {
                                //$vm1.section.items.splice(addItem[j].position, 0, item[0])
                                $($vm1.$el).find('.e-section-item[data-id="' + item.id + '"]').remove();
                                $vm1.addItem(item, addItem[j].position);
                                break;
                            }
                        }
                        //$vm0._deleteItem([item.id]);
                    }

                    //$vm0.updateItemsOrderFromView();
                    //$vm1.updateItemsOrderFromView();
                }

                this.$dataStore('tempSections', false);
            }, 200),
            _addNewSection: function (e) {
                if ($(e.target).data('mouse_hold_time') > 1100) {
                    this._addItems();
                } else {
                    this.$emit('add-new-section', [e, this]);
                }
            },
            _deleteSection: function (e) {

                if (!confirm(FE_Localize.get('confirm_delete_section'))) {
                    return;
                }

                this.status = 'removing';
                var trashItems = false;

                // Hold mouse down more than 1 second, then toggle all sections
                if ($(e.target).data('mouse_hold_time') > 1100) {
                    if (confirm(FE_Localize.get('confirm_trash_items_with_section'))) {
                        trashItems = true;
                    }
                } else {
                }

                this.$emit('delete-section', [e, trashItems, this]);
            },
            _deleteItem: function (data) {
                var item_ID = data[0],
                    multi = false,
                    confirmMsg = null;

                if (-1 !== this.isSelectedItem(item_ID)) {
                    item_ID = this.selectedItems;
                    multi = true;
                }

                if (data[1] || multi) {

                    if (data[1] && multi) {
                        confirmMsg = FE_Localize.get('confirm_trash_items');
                    } else if (multi) {
                        confirmMsg = FE_Localize.get('confirm_delete_items');
                    } else {
                        confirmMsg = FE_Localize.get('confirm_trash_item');
                    }

                    if (!confirm(confirmMsg)) {
                        return;
                    }

                    if (multi) {
                        this.selectedItems = [];
                    }
                } else {
                    if (!confirm(FE_Localize.get('confirm_remove_course_item'))) {
                        return;
                    }
                }

                var at = this.items.findIndex(function (item) {
                    return item.id == item_ID
                });

                this.$emit('delete-item', {
                    id: item_ID,
                    section_ID: this.section.id
                });

                this.$store().dispatch('deleteItem', {
                    item_ID: item_ID,
                    section_ID: this.section.id,
                    trash: data[1] ? 'yes' : 'no'
                });
                //
                // this.$nextTick($.proxy(function () {
                //     console.log(this.items)
                // }, this))

            },
            _startAnim: function (e) {
                $(e.target).addClass('anim');
            },
            _stopAnim: function (e) {
                $(e.target).removeClass('anim');
            },
            _selectItem: function (args) {
                var index = this.isSelectedItem(args[1].item.id);

                if (-1 === index) {
                    this.selectedItems.push(args[1].item.id)
                } else {
                    this.selectedItems.splice(index, 1)
                }
            },
            _deselectItem: function () {
                this.selectedItems = [];
            },
            _addItems: function (args) {
                var $ref = null, postTypes = {};
                if (args && args[1]) {
                    $ref = args[1];
                }

                this.$root.openModelSelectItems({
                    context: this,
                    postTypes: this.$dataStore('course_item_types'),
                    screen: 'lp_course',
                    screenID: this.$dataStore().course_ID,
                    select: function (args) {
                        if (args.items) {
                            var items = FE_Helpers.clone(args.items);
                            this.addItem(items, $ref)
                        }
                    },
                    exclude: function () {
                        return this.$root.getItemIds()
                    }
                });

            }
        }, FE_Base.Store_Methods)
    })

})(jQuery);