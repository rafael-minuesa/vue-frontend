;(function ($) {

    //$(document).ready(function ($) {

    Vue.component('fe-certificates', {
        data: function () {
            return {
                isActiveX: ''
            }
        },
        mounted: function () {
            this.isActiveX = $(this.$el).find('.themes .attachment[data-active="1"]').attr('data-id');
        },
        //el: '#certificate-browser',
        methods: {
            isActive: function (id) {
                return id == this.isActiveX;
            },
            getCertificateContainer: function (id) {
                return $(this.$el).find('#certificate-' + id)
            },
            _assign: function (e, cid, id) {
                e.preventDefault();
                var $vm = this;
                $.ajax({
                    url: '',
                    data: {'lp-ajax': 'update-course-certificate', course_id: cid, cert_id: id},
                    success: function () {
                        var $el = $vm.getCertificateContainer(id).addClass('active');

                        // Move active item to the first
                        $el.parent().prepend($el);
                        $vm.isActiveX = id;
                    }
                })
            },
            _remove: function (e, cid, id) {
                var $vm = this;
                e.preventDefault();
                $.ajax({
                    url: '',
                    data: {'lp-ajax': 'update-course-certificate', course_id: cid, cert_id: 0},
                    success: function () {
                        $vm.isActiveX = '';
                    }
                })
            },
            _openEdit: function (e) {
                e.preventDefault();
                window.location.href = $(e.target).data('href');
            }
        }
    });

    Vue.component('fe-content-drip-items', {
        props: ['courseData', 'sections'],
        data: function () {
            return {
                dripItems: {},
                itemsConfig: {},
                dripType: '',
                status: '',
                showModal: false,
                quickSettings: {
                    start: 1,
                    step: 1,
                    type: 'minute'
                }
            }
        },
        watch: {
            sections: {
                handler: function () {
                    this.syncItems();
                },
                deep: true
            }
        },
        created: function () {
            this.parseConfig();
        },
        mounted: function () {
            var $vm = this;
            this.parseConfig();
            this.syncItems();
            $(document).on('FE.editor-rendered', FE_Helpers.debounce(function () {
                $vm.xxx();
            }, 2000));
            window['fe-content-drip-items'] = this;
        },
        methods: {
            parseConfig: function () {
                this.itemsConfig = JSON.parse($('#fe-drip-content-items-config').html());
                this.dripType = this.itemsConfig.dripType;
            },
            syncItems: function () {
                var $vm = this, dripItems = {};
                this.sections.forEach(function (section) {
                    section.items.forEach(function (item) {
                        var it = {
                            id: item.id,
                            title: item.title,
                            type: item.type
                        };

                        if ($vm.dripItems['item_' + item.id]) {
                            it = $.extend({}, $vm.dripItems['item_' + item.id], it);
                        } else {
                            it.settings = $vm.getItemConfig(item);
                        }
                        dripItems['item_' + item.id] = it;
                    })
                });
                this.dripItems = dripItems;
                Vue.nextTick(function () {
                    $vm.xxx();
                })
            },
            xxx: function () {
                var $vm = this;
                $($vm.$el).find('.item-datepicker').datetimepicker({
                    timeFormat: 'HH:mm',
                    dateFormat: 'mm/dd/yy',
                    onSelect: function (value, opts) {
                        if (opts.id) {
                            FE_Helpers.fireNativeEvent($('#' + opts.id)[0], 'input');
                        } else {
                            FE_Helpers.fireNativeEvent($('#' + opts.inst.id)[0], 'input');
                        }
                    }
                });
                if ($vm.$refs.prerequisite) {
                    if ($.isArray($vm.$refs.prerequisite)) {
                        $vm.$refs.prerequisite.forEach(function (el) {
                            FE_Helpers.select2(el);
                        })
                    } else {
                        FE_Helpers.select2($vm.$refs.prerequisite);
                    }
                }

            },
            getItemConfig: function (item) {
                var config = {
                    type: 'immediately',
                    delay_interval_0: 0,
                    delay_interval_1: 'minute',
                    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
                    prerequisite: []
                }, c = this.itemsConfig['dripItems'][item.id];

                if (c) {

                    if (c.interval) {
                        config.delay_interval_0 = c.interval[0];
                        config.delay_interval_1 = c.interval[1];
                    }

                    if (c.type) {
                        config.type = c.type;
                    }

                    if (c.date) {
                        config.date = c.date;
                    }

                    if (c.prerequisite) {
                        config.prerequisite = $.isArray(c.prerequisite) ? c.prerequisite.map(function (a) {
                            return parseInt(a)
                        }) : []
                    }
                }

                return config;
            },
            isPrerequisite: function () {
                // sdas asDasdasdaopqie92348-32 u 3249032482394832904832094723904328 4e32 e123
                var carazyxxxxxx = this.courseData && Object.values(this.courseData).length ? this.courseData._lp_content_drip_drip_type == 'prerequisite' : (this.dripType === 'prerequisite');

                return carazyxxxxxx;
            },
            isSelectedItem: function (item, itemIndex, item2, itemIndex2) {
                var dripItems = Object.values(this.dripItems),
                    prevItem = function () {
                        var at = dripItems.findIndex(function (it) {
                            return it.id == item.id;
                        });

                        return at > 0 ? [dripItems[at - 1].id] : [];
                    },
                    selectedItems = $.isArray(item.settings['prerequisite']) && item.settings['prerequisite'].length ? item.settings['prerequisite'] : prevItem();
                return $.inArray(item2.id, selectedItems.map(function (a) {
                        return parseInt(a)
                    })) !== -1;
            },
            getButtonUpdateLabel: function (e) {
                return $(this.$refs['btn-update']).data(this.status === 'updating' ? 'text-update' : 'text');
            },
            _updateSettings: function (e) {
                var $vm = this, i = parseInt($vm.quickSettings.start);
                for (var prop in this.dripItems) {
                    if (!this.dripItems.hasOwnProperty(prop)) {
                        continue;
                    }

                    this.dripItems[prop].settings.type = 'interval';
                    this.dripItems[prop].settings.delay_interval_0 = i;
                    this.dripItems[prop].settings.delay_interval_1 = $vm.quickSettings.type;
                    i += parseInt($vm.quickSettings.step);

                }
            },
            _reset: function (e) {
                e.preventDefault();
                for (var prop in this.dripItems) {

                    if (!this.dripItems.hasOwnProperty(prop)) {
                        continue;
                    }

                    this.dripItems[prop].settings.type = 'immediately';
                    this.dripItems[prop].settings.delay_interval_0 = 0;
                    this.dripItems[prop].settings.delay_interval_1 = 'minute';
                }
            },
            _showModal: function (e) {
                e.preventDefault();
                this.showModal = true;
            },
            _save: function ($event, courseId) {
                if (!this.dripItems) {
                    return;
                }
                this.status = 'updating';

                var $vm = this, data = {}, item, prop;
                for (prop in this.dripItems) {
                    if (!this.dripItems.hasOwnProperty(prop)) {
                        continue;
                    }

                    item = this.dripItems[prop];

                    data[item.id] = {
                        type: item.settings.type || 'immediately',
                        interval: [item.settings.delay_interval_0 || 0, item.settings.delay_interval_1 || 'minute'],
                        prerequisite: item.settings.prerequisite ? item.settings.prerequisite.map(function (a) {
                            return parseInt(a)
                        }) : [],
                        date: item.settings.date
                    }
                }
                $.ajax({
                    url: lpGlobalSettings.ajax + '?action=e_update_content_drip_settings',
                    data: {
                        courseId: courseId,
                        'item-delay': data
                    },
                    type: 'post',
                    success: function () {
                        $vm.status = '';
                    },
                    error: function () {
                        $vm.status = '';
                    }
                })
            },
            _close: function () {
                this.showModal = false;
            }
        }
    });

    //})

})(jQuery);