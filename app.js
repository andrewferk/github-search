
// Initialize and wire the Github API and the Github Search Application.
$(function() {
  var githubAPI = window.githubAPI = new GithubAPI();
  var app       = window.app       = new GithubSearchApp($("body"),
                                                         githubAPI);
});


/**
 * The Github Search Application adds a search button and limit display. When
 * the search button is submitted, the input's value is delegated to GithubAPI
 * for keyword repository search. Results are display in a list, which when
 * clicked, displays further repository information.
 */
var GithubSearchApp = function($el, api) {

  var that = this;
 
  // Localized jQuery DOM elements
  var $search  = $f("#search");
  var $results = $f("#results");
  var $button  = $("<button>Search</button>");
  var $limit   = $("<em/>");
  var $form    = $("<form></form>");

  // Replace the original search input with a form, input, and submit button.
  // After the submit button, display an API limit helper.
  $form.append($search, $button, $limit);
  $el.prepend($form);

  // Update the API limit
  updateRateLimit();

  // When the form is submitted, begin the search process.
  $form.bind("submit", searchChange);

  // When an a.github-alert element is clicked, alert the associated repo.
  $results.on("click", "a.github-alert", alertRepo);

  // Localize jQuery element search to the passed in element.
  function $f(selector) {
    return $el.find(selector);
  }

  // Delegate the Github API rate limit request, and display the results by
  // updating the $limit element.
  function updateRateLimit() {
    api.getRateLimit(function(remaining, limit) {
      $limit.html("Rate Limit: " + remaining + "/" + limit);
    });
  }

  // When a search is submitted, prevent default submit action and begin the
  // search process.
  function searchChange(e) {
    e.preventDefault();
    doSearch();
  }

  // Get the value of the search input, and delegate the value to Github API.
  // When the search is complete, begin handling the results.
  function doSearch() {
    var keyword = $search.val();
    api.getReposSearch(keyword, doResults);
  }

  // When a search is complete, update the rate limit and create a list of the
  // repositories returned from the search.
  function doResults(repos) {
    updateRateLimit();
    updateList(repos);
  }

  // Create and display a list for the given list of repositories.
  function updateList(repos) {
    var $ul = $("<ul/>");
    
    // For each repository, create an item that when clicked on is expected
    // to display further information of the repository.
    for (var i in repos) {
      var repo = repos[i];


      // Give the link a special class for delegating clicks, store the
      // repository as data for the link, and give a defined text string for
      // display.
      var $link = $('<a href="#" class="github-alert"/>').
                  data("repo", repo).
                  text(repo.owner + "/" + repo.name);

      // Add the item to the list
      var $li = $('<li/>');
      $li.append($link);
      $ul.append($li);
    }

    // Update the results to display the list
    $results.html($ul);
  }

  // When a repository link is clicked, prevent default click action and alert
  // the repository's information.
  function alertRepo(e) {
    e.preventDefault();

    // Get repo information of the repository link that was clicked.
    var $el   = $(e.target);
    var repo  = $el.data("repo");

    // Alert the repository's information
    alert(
      "Owner: " + repo.owner + "\r\n" +
      "Name:  " + repo.name + "\r\n" +
      "Language: " + repo.language + "\r\n" +
      "Followers: " + repo.followers + "\r\n" +
      "URL: https://github.com/" + repo.owner + "/" + repo.name + "\r\n" +
      "Description: " + repo.description
    );
  }

};


/**
 * The Github API conforms to the Github's V3 API. It provides the ability to
 * get the API rate limit and results of of a repository keyword search. The
 * repository keyword search is cached using local storage.
 */
var GithubAPI = function() {

  var that = this;

  // Local caching of the rate limits
  var _rateRemaining = null;
  var _rateLimit     = null;

  // A helper for doing Github API GET requests
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

  // Pass in the remaining and limit of the Github rate limit to the passed in
  // function.
  function getRateLimit(func) {
    var result = true;

    // If rate limits have not already been requested, make an initial request
    // and set the limits.
    if (_rateRemaining === null || _rateLimit === null) {
      result = get("rate_limit", function(data) {
        _rateRemaining = data.data.rate.remaining;
        _rateLimit     = data.data.rate.limit;
      });
    }

    // When the limits are available, pass them to the passed in function.
    $.when(result).then(function() {
      func(_rateRemaining, _rateLimit);
    });
    return result;
  }

  // Pass in the keyword's search result's repositories to the passed in
  // function.
  function getReposSearch(keyword, func) {
    var result = true;

    // Try to get the results from local storage
    var cache = localStorage.getItem("GithubAPI/" + keyword);
    var repos = JSON.parse(cache);

    // If the search was not cached, make a request to Github for the results.
    if (cache === null) {
      result = get("legacy/repos/search/" + keyword, function(data) {
        
        // Update the limit rate
        _rateRemaining = data.meta["X-RateLimit-Remaining"];
        _rateLimit     = data.meta["X-RateLimit-Limit"];

        // Cache the search and results
        repos = data.data.repositories;
        localStorage.setItem("GithubAPI/" + keyword,
                             JSON.stringify(repos));
      });
    }

    // When the results are available, pass them to the passed in function.
    $.when(result).then(function() {
      func(repos);
    });
    return result;
  }

  // A privileged method for getting the rate limit
  this.getRateLimit = function(func) {
    return getRateLimit(func);
  }

  // A privileged method for search repositories by keyword
  this.getReposSearch = function(keyword, func) {
    return getReposSearch(keyword, func);
  }

};
