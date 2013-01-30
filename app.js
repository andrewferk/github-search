
// Initialize the Github Search Application when the DOM has loaded.
$(function() {
  var githubAPI = window.githubAPI = new GithubAPI();
  var app       = window.app       = new GithubSearchApp($("body"),
                                                         githubAPI);
});


/**
 * The Github Search Application takes the #search input's value, sends it as
 * a keyword to a GitHub repository search, and displays the results in a
 * list. Further information about the repository can be obtained by clicking
 * on the repository's link.
 */
var GithubSearchApp = function($el, api) {

  var that = this;
  
  var $search  = $f("#search");
  var $results = $f("#results");
  var $button  = $("<button>Search</button>");
  var $limit   = $("<em/>");
  var $form    = $("<form></form>");

  $form.append($search, $button, $limit);
  $el.prepend($form);
  $form.bind("submit", searchChange);
  updateRateLimit();

  var $event   = $("<u/>");
  var e_search = $.Event("search");

  function $f(selector) {
    return $el.find(selector);
  }

  function updateRateLimit() {
    api.getRateLimit(function(remaining, limit) {
      $limit.html("Rate Limit: " + remaining + "/" + limit);
    });
  }

  function searchChange(e) {
    e.preventDefault();
    doSearch();
  }

  function doSearch() {
    var keyword = $search.val();
    api.getReposSearch(keyword, parseResults);
  }

  function parseResults(repos) {
    updateRateLimit();
    updateList(repos);
  }

  function updateList(repos) {
    var $ul = $("<ul/>");
    
    for (var i in repos) {
      var repo = repos[i];
      var $li = $("<li>" + repo.owner + "/" + repo.name + "</li>");
      $ul.append($li);
    }

    $results.html($ul);
  }

};


var GithubAPI = function() {

  var that = this;

  var _rateRemaining = null;
  var _rateLimit     = null;

  function get(url, func) {
    return $.ajax("https://api.github.com/" + url, {
      crossDomain: true,
      dataType: "jsonp"
    }).done(function(data, status, jqxhr) {
      if (func) {
        func(data, status, jqxhr);
      }
    });
  }

  this.getRateLimit = function(func) {
    var result = true;

    if (_rateRemaining === null || _rateLimit === null) {
      result = get("rate_limit", function(data) {
        _rateRemaining = data.data.rate.remaining;
        _rateLimit     = data.data.rate.limit;
      });
    }

    $.when(result).then(function() {
      func(_rateRemaining, _rateLimit);
    });
    return result;
  }

  this.getReposSearch = function(keyword, func) {
    return get("legacy/repos/search/" + keyword, function(data) {
      _rateRemaining = data.meta["X-RateLimit-Remaining"];
      _rateLimit     = data.meta["X-RateLimit-Limit"];

      func(data.data.repositories);
    });
  }

};
