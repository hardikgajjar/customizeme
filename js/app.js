/* A custom jQuery plugin for product customization tool */

;(function ( $, window, document, undefined ) {

    var customizeMe = function(element, options) {

        // element is the target
        this.element = element;

        // options is the options passed from jQuery
        this.options = $.extend({

            // default options here
            width: 750,
            height: 600,
            contextMenu: {
                CONTEXT_MENU_BRING_TO_FRONT: "Bring to front",
                CONTEXT_MENU_BRING_FORWARD: "Bring forward",
                CONTEXT_MENU_SEND_BACKWARDS: "Send to backward",
                CONTEXT_MENU_SEND_TO_BACK: "Send to back"
            },
            colorHexMap: {
                'white':'#ffffff',
                'melange':'#bcbcbc',
                'light-grey':'#8d9291',
                'grey':'#9b978e',
                'red':'#D21034',
                'orange':'#E96B10',
                'black':'#000000',
                'light-brown':'#993300',
                'pistachio':'#ccffcc',
                'burgundy':'#96004B',
                'beige':'#d0c79c',
                'pink':'#f6b4a7',
                'yellow':'#FFDE1B',
                'light-blue':'#87c3d2',
                'blue':'#61B6C5',
                'dark-blue':'#0B2345',
                'green':'#289728',
                'gold':'#d6c389',
                'silver':'#CDD3CD',
                'lilac':'#d0a2c7',
                'bright-blue':'#296DC1',
                'dark-green':'#008800',
                'dark-red':'#A83C0F',
                'ivory':'#EEEBB6',
                'lime-green':'#BAE55F',
                'sand':'#C5BA8E',
                'sky-blue':'#53CAEB',
                'torquoise':'#48B8D2',
                'light-green':'#95D22B'
            }

        }, options);

        this.setup();
    };

    customizeMe.prototype = {

        // bring back constructor
        constructor: customizeMe,

        // setup
        setup: function() {

            //setup canvas
            this.setupCanvas();

            //setup controls
            this.setupControls();

            return this;
        },
        setupCanvas: function() {
            var _this = this;

            var canvas = new fabric.Canvas(this.element, {
                controlsAboveOverlay: 1,
                width: this.options.width,
                height: this.options.height
            });
            this.canvas = canvas;

            customizeMe.ObjectResizer.init(this);

            // setup canvas events
            this.setupCanvasEvents();

            window.canvas = canvas; // for test

            //set default product's background and overlay images
            $.each(this.options.products, function(i, e) {
                if (e.default == 1) {
                    _this.setCanvasBgAndOverlay(e);
                    //init clipping
                    _this.initClipping(e);
                    //init style and colors for this product
                    _this.initStyleAndColors(e);
                    // set current product
                    _this.currentProduct = e;
                }
            });
        },
        setupControls: function() {
            var _this = this;
            // TODO: create all controls HTML dynamically

            //bind context menu
            customizeMe.ContextMenu.initialize(this);

            //bind remove objects on escape
            this.removeObjectsOnEscape();

            //bind ajax file upload
            this.setupAjaxFileUpload();

            //bind add text
            this.setupAddText();

            //bind other products
            this.setupOtherProducts();
        },
        initStyleAndColors: function(product) {
            var _this = this;
            $('ul.style-and-color').empty();
            if (product.colors) {
                $.each(product.colors, function(color, e) {
                    var html = $('<a>', {
                        href: '#',
                        'data-color': color
                    }).css('background', _this.options.colorHexMap[color]);

                    if (e.default == 1) html.addClass('active');

                    $('ul.style-and-color').append(html);
                    html.wrap('<li></li>');

                    html.on('click', function() {
                        $('ul.style-and-color li a').removeClass('active');
                        $(this).addClass('active');
                        //set product background for this color
                        _this.setCanvasBgAndOverlay(e);
                        return false;
                    });
                })
            }
        },
        setupAjaxFileUpload: function() {
            var _this = this;

            //setup progress bar
            var myPicturesForm = $('#my_pictures form');
            var uploadedImages = $('.uploaded-images');
            var progress = $('<div class="progress"></div>');
            var progressBar = $('<div>', {
                class               : 'progress-bar',
                role                : 'progressbar',
                'aria-valuenow'     : 0,
                'aria-valuemin'     : 0,
                'aria-valuemax'     : 100
            });
            progress.append(progressBar);
            progress.insertAfter(myPicturesForm.find('input[type=file]'));
            progress.hide();

            // bind add picture
            uploadedImages.on('click', 'a', function(e){

                if ($(e.target).hasClass('remove')) {
                    $(this).parent('li').remove();
                    return false;
                }

                var __this = this;
                fabric.Image.fromURL($(this).attr('href'), function(img) {

                    _this.canvas.add(img);

                    // scale image to fit in canvas area
                    if (img.width > (_this.canvas.width * 0.75)) {
                        var origWidth = img.width;
                        img.scaleToWidth(_this.canvas.width * 0.75);
                        img.center();
                        img.setCoords(); //update controls area
                    }
                    // fire scaling event to check size of this image by dpi
                    _this.canvas.trigger('object:scaling');
                });
                return false;
            });

            myPicturesForm.ajaxForm({
                beforeSend: function() {
                    progressBar.attr('aria-valuenow', 0);
                    progressBar.width('0%');
                    progressBar.html('0%');
                    progress.show();
                },
                uploadProgress: function(event, position, total, percentComplete) {
                    var percentVal = percentComplete + '%';
                    progressBar.attr('aria-valuenow', percentComplete);
                    progressBar.width(percentVal);
                    progressBar.html(percentVal);
                },
                success: function(res) {
                    var percentVal = '100%';
                    progressBar.attr('aria-valuenow', 100);
                    progressBar.width(percentVal);
                    progressBar.html(percentVal);

                    try {
                        var res = $.parseJSON(res);
                        var html = $('<a>', {href: res.success});
                        html.append($('<span>', {class:'remove glyphicon glyphicon-remove'}));
                        html.append($('<img>', {
                            class: 'canvas-img',
                            src: res.success
                        }));
                        uploadedImages.append(html);
                        html.wrap('<li></li>');

                    } catch (e) {

                    }
                },
                complete: function(xhr) {
                    progress.hide();
                }
            });
        },
        setupAddText: function() {
            var _this = this;
            var textControlsCounter = 1;
            $('.add-text').on('click', function() {
                var html = $('<li class="canvas-object"></li>');
                html.append('<div class="text"><div class="body"></div><div class="controls"><div class="dropdown"><button class="btn btn-default dropdown-toggle" type="button" id="fontFamilyMenu'+textControlsCounter+'" data-toggle="dropdown" data-placement="left" title="Font">Halvetica<span class="caret"></span></button><ul class="dropdown-menu font-family-menu" role="menu" aria-labelledby="fontFamilyMenu'+textControlsCounter+'"><li role="presentation"><a class="arial" data-fontname="arial" role="menuitem" tabindex="-1" href="#">Arial</a></li><li role="presentation"><a class="halvetica" data-fontname="halvetica" role="menuitem" tabindex="-1" href="#">Halvetica</a></li><li role="presentation"><a class="verdana" data-fontname="verdana" role="menuitem" tabindex="-1" href="#">Verdana</a></li></ul><select class="form-control font-size" name="font-size" title="Font Size" data-placement="left"><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="14">14</option><option value="18">18</option><option value="24">24</option><option value="30">30</option><option value="36">36</option><option value="48">48</option><option value="60">60</option><option value="72">72</option><option value="96">96</option></select><span class="glyphicon glyphicon-font font-color font-color-foreground"></span><span class="glyphicon glyphicon-tint font-color font-color-background"></span></div></div></div>');
                textControlsCounter++;
                var textarea = $('<textarea class="form-control">Sample Text</textarea>');
                html.find('.body').append(textarea);
                html.find('.controls button.btn, .controls select').tooltip();
                $('.canvas-objects.text').append(html);

                var text = new fabric.Text('Sample Text', { left: _this.canvas.width/2, top: _this.canvas.height/2 });
                text.setControlsVisibility({ mb: false, mt: false, ml: false, mr: false });
                _this.canvas.add(text);

                html.data('canvas-object-instance', text);

                textarea.on({
                    mousedown: function() {
                        var objElement = $(this).parents('.canvas-object');
                        _this.toggleTextControls(objElement);
                        _this.canvas.setActiveObject(objElement.data('canvas-object-instance'));
                    },
                    keyup: function() {
                        text.setText($(this).val());
                        _this.canvas.renderAll();
                    }
                }).mousedown();

                //bind font-color chooser
                html.find('span.font-color-foreground').minicolors({
                    opacity: true,
                    change: function(hex, opacity) {
                        var obj = $(this).parents('.canvas-object').data('canvas-object-instance');
                        //set font color and opacity
                        obj.setColor(hex).setOpacity(opacity);
                        _this.canvas.renderAll();
                    }
                });

                //bind font-background-color chooser
                html.find('span.font-color-background').minicolors({
                    opacity: true,
                    change: function(hex, opacity) {
                        var obj = $(this).parents('.canvas-object').data('canvas-object-instance');
                        //set font color and opacity
                        obj.setTextBackgroundColor(hex).setOpacity(opacity);
                        _this.canvas.renderAll();
                    }
                });

            });
            //live bind font-family menu
            $('.canvas-objects.text').on('click', 'ul.font-family-menu a', function(){
                var id = $(this).parents('ul.dropdown-menu').attr('aria-labelledby');
                $('#'+id).dropdown('toggle');
                $('#'+id).text($(this).text()).append('<span class="caret"></span>');
                var obj = $(this).parents('.canvas-object').data('canvas-object-instance');
                obj.set({fontFamily: $(this).data('fontname')});
                _this.canvas.renderAll();
                return false;
            });
            //live bind font-size dropdown
            $('.canvas-objects.text').on('change', 'select.font-size', function(){
                var obj = $(this).parents('.canvas-object').data('canvas-object-instance');
                obj.set({fontSize: $(this).val()});
                _this.canvas.renderAll();
            });
        },
        setupOtherProducts: function() {
            var _this = this;
            if (this.options.products) {
                $.each(this.options.products, function(i, e) {
                    var html = $('<a>', {href: '#'});
                    html.append($('<img>', {
                        class: 'product-img',
                        src: e.smallImage
                    }));
                    $('ul.other-products').append(html);
                    html.wrap('<li></li>');

                    html.on('click', function() {
                        //set product background and overlay images
                        _this.setCanvasBgAndOverlay(e);
                        // init clipping
                        _this.initClipping(e);
                        // init style and color
                        _this.initStyleAndColors(e);
                        // set current product
                        _this.currentProduct = e;

                        // fire scaling event to check size of all objects by dpi
                        _this.canvas.trigger('object:scaling');

                        return false;
                    });
                })
            }
        },
        setCanvasBgAndOverlay: function(e) {
            var _this = this;
            if (typeof(e.backgroundImage) != undefined) {
                if ($('.canvas-bg').length > 0) {
                    $('.canvas-bg').attr('src', e.backgroundImage);
                } else {
                    var bgImage = $('<img>', {
                        class   : 'canvas-bg',
                        src     : e.backgroundImage
                    });
                    bgImage.insertBefore(_this.element);
                }

            }
            if (typeof(e.overlayImage) != undefined) {
                _this.canvas.setOverlayImage(e.overlayImage, _this.canvas.renderAll.bind(_this.canvas), {
                    left: 75
                });
            }
        },
        initClipping: function(product) {
            var _this = this;
            _this.canvas.clipTo = function(ctx) {
                ctx.rect(product.dimensions[0],product.dimensions[1],product.dimensions[2],product.dimensions[3]);
            };
        },
        removeObjectsOnEscape: function() {
            var _this = this;
            $(document).keyup(function(e) {
                if (e.keyCode == 27) { // esc
                    if (_this.canvas.getActiveObject()) {
                        // if text then remove its associated controls also
                        if (_this.canvas.getActiveObject().type == 'text') {
                            var e = _this.objectToEl(_this.canvas.getActiveObject());
                            if (e) e.remove();
                        }

                        _this.canvas.remove(_this.canvas.getActiveObject());
                    }
                }
            });
        },
        objectToEl: function(obj) {
            var el;
            $(".canvas-objects .canvas-object").each(function(i,e){
                if ($(e).data("canvas-object-instance") === obj) {
                    el = e;
                }
            });
            return el;
        },
        sendActiveObjectToBack: function() {
            this.canvas.sendToBack(this.canvas.getActiveObject())
        },
        bringActiveObjectToFront: function() {
            this.canvas.bringToFront(this.canvas.getActiveObject())
        },
        sendActiveObjectBackwards: function() {
            this.canvas.sendBackwards(this.canvas.getActiveObject())
        },
        bringActiveObjectForward: function() {
            this.canvas.bringForward(this.canvas.getActiveObject())
        },
        setupCanvasEvents: function() {
            var _this = this;
            this.canvas.on('mouse:down', function(options) {
                if (_this.canvas.getActiveObject()) {
                    var e = _this.objectToEl(_this.canvas.getActiveObject());
                    if ($(e).children('textarea')) {
                        $(e).parents('div.collapse').collapse('show');
                        setTimeout(function(){
                            $(e).find('textarea').focus().select();
                            _this.toggleTextControls(e);
                        },0);
                    }
                }
            }).on("object:scaling", this.checkScaledUpImages.bind(this));

        },
        toggleTextControls: function(e) {
            $('.canvas-objects.text div.text').removeClass('active');
            $(e).find('textarea').parents('div.text').addClass('active');
            $('.canvas-objects.text div.text div.controls').hide();
            $(e).find('textarea').parents('div.text').children('div.controls').show();
        },
        checkScaledUpImages: function() {
            var alert = $(".scaled-images-warning");

            if (this.hasScaledUpImages()) {
                if (alert.is(":visible")) return;
                alert.show(), alert.animate({
                    backgroundColor: "rgba(255, 0, 0, 0.9)"
                }, 50, function() {
                    alert.animate({
                        backgroundColor: "rgba(255, 200, 200, 0.9)"
                    })
                })
            } else alert.hide()
        },
        hasScaledUpImages: function() {
            for (var objects = this.canvas.getObjects(), i = objects.length; i--;)
                if (objects[i] && customizeMe.ObjectResizer.isBelowMinDPI(objects[i])) return 1;
            return 0;
        }
    };

    customizeMe.ContextMenu = {
        iconsMap: {
            CONTEXT_MENU_BRING_TO_FRONT: "glyphicon-fast-forward",
            CONTEXT_MENU_BRING_FORWARD: "glyphicon-step-forward",
            CONTEXT_MENU_SEND_BACKWARDS: "glyphicon-step-backward",
            CONTEXT_MENU_SEND_TO_BACK: "glyphicon-fast-backward"
        },
        initialize: function(t) {
            this.dashboard = t;
            this.dashboard.contextMenu = this.createMenu()
        },
        createMenu: function() {
            var t = this;

            return new jQuery.contextMenu({
                selector: '.canvas-container',
                className: 'context-menu',
                zIndex: 1100,
                items: t.buildContextMenuItems(),
                events: {
                    show: function(e) {
                        return t.beforeContextMenuShow.call(this, t)
                    }
                }
            })
        },
        getText: function(t) {
            var e = t in this.iconsMap ? '<i class="glyphicon ' + this.iconsMap[t] + '"></i>' : "";
            return e + this.dashboard.options.contextMenu[t];
        },
        beforeContextMenuShow: function(t) {
            var i = t.dashboard.canvas.getActiveObject();
            if (!i) return !1;
        },
        buildContextMenuItems: function() {
            return [{
                name: this.getText("CONTEXT_MENU_SEND_BACKWARDS"),
                callback: $.proxy(this.onContextSendBackwards, this)
            }, {
                name: this.getText("CONTEXT_MENU_SEND_TO_BACK"),
                callback: $.proxy(this.onContextSendToBack, this)
            }, {
                name: this.getText("CONTEXT_MENU_BRING_FORWARD"),
                callback: $.proxy(this.onContextBringForward, this)
            }, {
                name: this.getText("CONTEXT_MENU_BRING_TO_FRONT"),
                callback: $.proxy(this.onContextBringToFront, this)
            }]
        },
        onContextSendToBack: function() {
            this.dashboard.sendActiveObjectToBack()
        },
        onContextBringToFront: function() {
            this.dashboard.bringActiveObjectToFront()
        },
        onContextSendBackwards: function() {
            this.dashboard.sendActiveObjectBackwards()
        },
        onContextBringForward: function() {
            this.dashboard.bringActiveObjectForward()
        },
        renderAll: function() {
            this.dashboard.canvas.renderAll()
        }
    };

    customizeMe.ObjectResizer = {
        VECTOR_TYPES: ['application/pdf','image/svg+xml','application/postscript'],
        SCALE_MARGIN: 0,
        init: function(t) {
            this.dashboard = t, this.canvas = t.canvas
        },
        isVector: function(obj) {
            return this.VECTOR_TYPES.indexOf(obj.imageType) > -1
        },
        getHeightForCurrentSideDPI: function(obj, multiplier, dpi) {
            return obj.height / multiplier * dpi
        },
        getWidthForCurrentSideDPI: function(obj, multiplier, dpi) {
            return obj.width / multiplier * dpi
        },
        getCurrentSideMetadata: function() {
            return this.dashboard.currentProduct;
        },
        isBelowMinDPI: function(obj) {
            if (obj.type != 'image') return 0;
            var multiplier = 150,
                dpi = this.getCurrentSideMetadata().dpi,
                heightByDpi = this.getHeightForCurrentSideDPI(obj, multiplier, dpi),
                widthByDpi = this.getWidthForCurrentSideDPI(obj, multiplier, dpi);

            return obj.getHeight() > heightByDpi || obj.getWidth() > widthByDpi
        }
    };

    // the jQuery prototype
    $.fn.customizeMe = function( options ) {

        // loop though elements and return the jQuery instance
        return this.each( function() {

            // initialize and insert instance into $.data
            $(this).data('customizeMe', new customizeMe( this, options ) );
        });
    };

})( jQuery, window, document );
