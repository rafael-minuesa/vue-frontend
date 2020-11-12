;(function ($) {
    "use strict";

    Vue.component('e-course-curriculum', {
        template: '#tmpl-e-course-curriculum',
        props: ['sections', 'item', 'store'],
        computed: {
            // countItems: function () {
            //     return 10;
            // }
        },
        watch: {
            sections:{
                handler: function () {
                    var newSections = this.sections.filter(function (section) {
                        var r = section.id === undefined;
                        if(r){
                            section.id = LP.uniqueId();
                        }

                        return r;
                    });

                    this
                },
                deep: true
            }
        },
        mounted: function () {
            this.$section = null;
            $(this.$el).find('.e-course-sections').sortable({
                axis: 'y',
                handle: '.e-section-head .sort',
                items: '.e-section:not(.placeholder)',
                update: $.proxy(function (e, ui) {
                    this.updateSectionsOrderFromView();
                }, this)
            });

            $(window).on('resize.frontend-editor-settings', this.resize).trigger('resize');
        },
        methods: $.extend({}, FE_Base.Store_Methods, {
            clickMe: function () {
            },
            resize: FE_Helpers.debounce(function ($vm) {
                var $dv = $('#e-tab-content-curriculum');
                $dv.css({
                    height: $(window).height() - ($dv.offset().top - $(window).scrollTop())
                });
            }, 100),
            onFocusSection: function ($section) {
                this.$section = $section;
                var $thisTitle = $($section.$el).find('.section-title');
                $('.section-title').not($thisTitle).each(function () {
                    var $s = $(this).data('$instance');
                    $s && $s.onBlur();
                })
            },
            onBlurSection: function ($section) {
            },
            moveNextInput: function () {
                var $nextEl = $(this.$section.$el).next().find('.section-title').focus();
                if ($nextEl.length) {
                    $nextEl.data('$instance').onFocus();
                }
                else {
                    this.addNewSection();
                }
            },
            onPressTitle: function (e) {
                this.$emit('pressTitle', e, FE_Helpers.getKeyboard(e));
            },
            onPressTitleCallback: FE_Helpers.debounce(function (e) {
                this.$emit('pressTitle', e, FE_Helpers.getKeyboard(e));
            }, 10, this),

            addNewSection: function (position, section) {
                if (position === undefined || position < 0) {
                    position = this.sections.length;
                }

                section = $.extend({
                    id: LP.uniqueId(),
                    title: '',
                    items: []
                }, section || {});

                this.sections.splice(position, 0, section);
                var $vm = this;
                return new Promise(function (a, b) {
                    FE_Helpers.debounce(function () {
                        a($vm.getSection(section.id));
                    }, 100)()
                })
            },
            openItemSettings: function ($item, $section) {
                this.$emit('openItemSettings', $item, $section)
                this.$parent.openItemSettings($item, $section);
            },
            getSection: function (sectionID) {
                var $el = this.$('.e-section[data-id="' + sectionID + '"]').find('.section-title');

                return $el.data('$instance');
            },
            moveSection: function (data) {
                var $vm = data[0],
                    dir = data[1],
                    $section = $(this.$el).find('.e-section[data-id="' + $vm.section.id + '"]'),
                    $sections = $section.parent().children(),
                    $anchor = null;

                if (dir === 'up') {
                    if (data[2]) {
                        $anchor = $sections.first();
                    } else {
                        $anchor = $section.prev();
                    }
                } else {
                    if (data[2]) {
                        $anchor = $sections.last();
                    } else {
                        $anchor = $section.next();
                    }
                }

                if (!$anchor.length) {
                    return;
                }

                if (dir === 'up') {
                    $section.insertBefore($anchor);
                } else {
                    $section.insertAfter($anchor);
                }

                this.updateSectionsOrderFromView();
            },
            updateSectionsOrderFromView: function ($sections) {

                if (!$sections) {
                    $sections = $(this.$el).find('.e-section');
                }

                this.$dataStore().sections = FE_Helpers.sortArrayByDOM(this.$dataStore().sections, '', 'id', $sections);
                this.$dispatch('updateSectionsOrder', {
                    sections: this.$dataStore().sections
                });
            },
            countItems: function () {
                var count = 0;
                $.each(this.$dataStore().sections, function () {
                    count += this.items.length;
                });

                return count;
            },
            onAddedItem: function (item, $vm) {
                this.$root.item = item;
            },
            _addNewSection: function (data) {
                var $section = $(data[0].target).closest('.e-section'),
                    $sections = $section.parent().children(),
                    position = $sections.index($section);
                this.addNewSection(position + 1);
            },
            _deleteSection: function (data) {
                var id = $(data[0].target).closest('.e-section').attr('data-id');

                this.$store().dispatch('removeSection', {
                    section_ID: id,
                    trash_items: data[1]
                }).then($.proxy(function (r) {
                    this.$store().commit('removeSection', {section_ID: id});
                }, this));
            },
            _toggleSections: function () {
                var hidden = [];
                $(this.$el).find('.e-section').each(function () {
                    var $section = $(this);
                    if ($section.hasClass('closed')) {
                        hidden.push($section.attr('data-id'));
                    }
                });
                this.$dataStore().admin_hidden_sections = hidden;

                this.$dispatch('updateHiddenSections', hidden);
            },
            _deleteItem: function (args) {
                if(!this.item){
                    return;
                }

                // Active item (is editing)
                if(this.item.id == args.id){
                    setTimeout(function ($vm) {
                        $vm.item = null;
                        $vm.$parent.item = null;
                        LP.setUrl(window.location.href.replace(args.id+'/', ''))
                    }, 300, this)
                }
            }
        })
    })

})(jQuery);

