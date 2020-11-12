;(function ($) {
    "use strict";
    Vue.component('e-modal-pagination', {
        template: '#tmpl-e-modal-pagination',
        props: ['total', 'page'],
        methods: {
            update: function () {
                this.$emit('pagination-update', this.page);
            },

            nextPage: function () {
                if (this.page < this.total) {
                    this.page++;
                    this.update();
                }
            },

            nextLastPage: function () {
                if (this.page < this.total) {
                    this.page = this.total;
                    this.update();
                }
            },

            previousPage: function () {
                if (this.page > 1) {
                    this.page--;
                    this.update();
                }
            },

            previousFirstPage: function () {
                if (this.page > 1) {
                    this.page = 1;
                    this.update();
                }
            },
            _reload: function () {
                this.$parent.queryItems();
            }
        }
    });
    Vue.component('e-modal-select-items', {
        template: '#tmpl-e-modal-select-items',
        props: ['xyz', 'title', 'modalData'],
        data: function () {
            return {
                dataChanged: false,
                currentType: '',
                items: [],
                term: '',
                selectedItems: [],
                pagination: {},
                status: '',
                view: 'listing',
                filters: {
                    itemsPerPage: 10,
                    filterBy: '',
                    filterOrder: 'asc'
                }
            }
        },
        watch: {
            term: function (v) {
                this._queryItems(this);
                return v;
            }
        },
        computed: {
            selectButton: function () {
                if (this.modalData.selectButton !== undefined) {
                    return this.modalData.selectButton;
                }
                return FE_Localize.get('modal_select_button');
            },
            modalTitle: function () {
                return this.modalData.modalTitle;
            }
        },
        mounted: function () {
            if (!this.currentType) {
                this.currentType = this.modalData.postTypes[0].type;
            }
            this.queryItems();
            $(window).trigger('resize')
        },
        methods: $.extend({}, FE_Base.Store_Methods, {
            isCurrentTab: function (type) {
                return this.currentType == type;
            },

            queryItems: function (e) {
                var $vm = this;

                if (e && $(e.target).is('select')) {
                    this.pagination.current = 1;
                }
                var modalData = this.modalData,
                    exclude = $.isFunction(modalData.exclude) ? modalData.exclude.call(modalData.context) : modalData.exclude;

                this.status = 'sending';
                this.$store().dispatch('queryItems', {
                    term: this.term,
                    type: this.currentType,
                    context: this.modalData.screen,
                    context_id: this.modalData.screenID,
                    paged: this.pagination.current || 1,
                    exclude: exclude,
                    filters: this.filters
                }).then($.proxy(function (r) {
                    $vm.items = r.items;
                    $vm.pagination = r.pagination || {};
                    $vm.status = '';
                }, this));
            },

            isSelected: function (itemId) {
                return this.selectedItems.findIndex(function (a) {
                        return a == itemId || a.id == itemId;
                    }) !== -1
            },
            modalClass: function () {
                var cls = ['e-modal'];

                cls.push(this.status);

                return cls;
            },
            countSelectedItems: function () {
                return (this.selectedItems.length ? ' (' + this.selectedItems.length + ')' : '');
            },
            filterClass: function (filter) {
                var cls = ['e-sort-items'];

                if (this.filters.filterBy === filter) {
                    cls.push('current');
                    cls.push(this.filters.filterOrder);
                }

                return cls;
            },
            getItemTitle: function (id) {
                var item = this.getItem(id);

                if (item) {
                    return item.title;
                }
            },
            getItem: function (id) {
                return this.items.find(function (a) {
                    return a.id == id;
                });
            },
            _queryItems: FE_Helpers.debounce(function ($vm) {
                $vm.queryItems()
            }, 300),
            _close: function (e) {
                e.preventDefault();
                this.xyz.show = false;
            },
            _changeType: function (e, type) {
                this.currentType = type;
                this.queryItems();
            },
            _selectItem: function (e) {
                var input = e.target;
                if (input.checked) {
                    if (!this.isSelected(input.value)) {
                        this.selectedItems.push(this.getItem(input.value));
                    }
                } else {
                    var find = this.selectedItems.findIndex(function (a) {
                        return a == input.value || a.id == input.value;
                    });

                    if (-1 !== find) {
                        this.selectedItems.splice(find, 1);
                    }
                }
            },
            _changePage: function (page) {
                this.pagination.current = page;
                this.queryItems();
            },
            _switch: function (e, view) {
                this.view = view;
            },
            _clear: function () {
                this.selectedItems = [];
            },
            _sort: function (e, sortBy) {

                if (this.filters.filterBy === '') {
                    this.filters.filterOrder = 'asc';
                } else {
                    if (this.filters.filterBy === sortBy) {
                        if (this.filters.filterOrder === 'asc') {
                            this.filters.filterOrder = 'desc';
                        } else {
                            sortBy = '';
                        }
                    }
                }
                this.filters.filterBy = sortBy;

                this.queryItems();
            },
            _select: function () {
                if (!this.modalData) {
                    return;
                }

                var data = this.modalData;

                if (data.select) {
                    data.select.apply(data.context, [{items: this.selectedItems}])
                }

                this.selectedItems = [];
                this.queryItems();
            }
        })
    });
})(jQuery);