/**
 * @file Processes the stylesheet (desktop(default)/mobile) for an HTML page.
 */


/**
 * Set the initial stylesheet of the HTML page, based on screen width.
 * @param {boolean} parentDir Indicates whether or not the stylesheet is in the parent directory of the HTML page.
 */
function initStylesheet(parentDir) { setStylesheet(screen.width < 512, parentDir); }


/**
 * Switch the stylesheet of the HTML page between desktop and mobile.
 * @param {boolean} parentDir Indicates whether or not the stylesheet is in the parent directory of the HTML page.
 */
function switchStylesheet(parentDir)
{
  var switchAElement;

  switchAElement = document.getElementById("switchA");
  setStylesheet(switchAElement.innerHTML == "mobile", parentDir);
}


/**
 * Set the stylesheet of the HTML page as specified.
 * @private
 * @param {boolean} toMobile Indicates whether to use the mobile (true) or desktop (false) stylesheet.
 * @param {boolean} parentDir Indicates whether or not the stylesheet is in the parent directory of the HTML page.
 */
function setStylesheet(toMobile, parentDir)
{
  var relPath;
  var linkElement;
  var switchAElement;

  linkElement = document.getElementsByTagName("link")[0];
  switchAElement = document.getElementById("switchA");

  relPath = parentDir ? "../" : "";

  if (toMobile)
  {
    linkElement.href = relPath + "mobile.css";
    switchAElement.innerHTML = "desktop";
    return;
  }

  linkElement.href = relPath + "default.css";
  switchAElement.innerHTML = "mobile";
}
