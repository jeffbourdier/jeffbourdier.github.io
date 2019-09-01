/**
 * @file       Processes the stylesheet (desktop(default)/mobile) for an HTML page.
 *
 * @copyright  (c) 2016 Jeffrey Paul Bourdier
 *
 * @license    MIT
 * Licensed under the MIT License.  This file may be used only in compliance with this License.
 * Software distributed under this License is provided "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * For more information, see the following URL:  {@link https://opensource.org/licenses/MIT}
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
  var switchAElement = document.getElementById("switchA");
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
  var linkElement = document.getElementsByTagName("link")[0];
  var switchAElement = document.getElementById("switchA");
  var relPath = parentDir ? "../" : "";

  if (toMobile)
  {
    linkElement.href = relPath + "mobile.css";
    switchAElement.innerHTML = "desktop";
    return;
  }

  linkElement.href = relPath + "default.css";
  switchAElement.innerHTML = "mobile";
}
