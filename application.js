define(function (require) {

  var $          = require("jquery");
  var _          = require("underscore");
  var mediator   = require("./mediator");
  var Router     = require("cherrytree/router");
  var State      = require("./state");
  var LeapObject = require("./object");

  return LeapObject.extend({

    options: {
      location: "none",
      logging: false,
      routes: function  () {}
    },

    constructor: function (options) {
      this.options = _.extend({}, this.options, options);
    },

    start: function () {
      var router = this.router = mediator.router = new Router({
        location: this.options.location,
        logging: this.options.logging
      });
      router.urlChanged = function (url) {
        mediator.publish("transitioned", url);
      };
      // add default impl of an application state
      // in case a custom one is not provided
      router.state("application", State.extend({
        createOutlet: function () {
          this.outlet = $(document.body);
        }
      }));
      router.map(this.options.routes);
      router.startRouting();

      // we want to intercept all link clicks in case we're using push state
      // we want all link clicks to be handled via the router instead of
      // browser reloading the page
      if (router && router.location && router.location.usesPushState &&
          router.location.usesPushState()) {
        this.interceptLinks();
      }

      return this;
    },

    interceptLinks: function () {
      var router = this.router;
      // ignore links with data-bypass attribute
      $(document).on("click", "a:not([data-bypass])", function (evt) {
        // ignore clicks with prevented default
        if (evt.isDefaultPrevented()) {
          return;
        }
        // ignore cmd+click - those should open in new tab
        if (evt.metaKey) {
          return;
        }
        var href = $(this).attr("href");
        if (href &&
            href.length > 0 &&
            // don't intercept hash links
            href[0] !== "#" &&
            // don't intercept external/absolute links
            href.indexOf("http://") !== 0 &&
            href.indexOf("https://") !== 0 &&
            // or thes kind of links
            href.indexOf("javascript:") !== 0) {
          evt.preventDefault();
          router.transitionTo(href);
        }
      });

    }
  });

  /**

    TODO
    * for all leaf states, make sure there's a State class provided
    * throw if application state is not defined? or better fallback to a default
      one that injects things into body!
    * don't attach router to the mediator
      (views should use the router from the state or smth, e.g. like linkTo helper
      does, there should be a transitionTo and replaceWith on the view).
      For convenience, expose window.__app.router or smth

  */


});