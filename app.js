
// Initialize the Github Search Application when the DOM has loaded.
jQuery(document).ready(function($) {
  window.app = new GithubSearchApp($, $("body"));
});


/**
 * The Github Search Application takes the #search input's value, sends it as
 * a keyword to a GitHub repository search, and displays the results in a
 * list. Further information about the repository can be obtained by clicking
 * on the repository's link.
 */
var GithubSearchApp = function($, $el) {

  var $search  = $f("#search");
  var $results = $f("#results");

  var _searchTimeout = null;

  $search.bind("keyup", searchChange);

  function $f(selector) {
    return $el.find(selector);
  }

  function searchChange(e) {
    clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(doSearch, 300);
  }

  function doSearch() {
    var keyword = $search.val();

    $.ajax("https://api.github.com/legacy/repos/search/" + keyword, {
      cache: true,
      crossDomain: true,
      dataType: "jsonp"
    }).done(parseResults);
  }

  function parseResults(data, status, jqxhr) {
    var $ul = $("<ul/>");
    
    for (var i in data.data.repositories) {
      var repo = data.data.repositories[i];
      console.info(repo);
      var $li = $("<li>" + repo.owner + "/" + repo.name + "</li>");
      $ul.append($li);
    }

    $results.html($ul);
  }

};
