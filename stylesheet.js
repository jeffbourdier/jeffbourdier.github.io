function initStylesheet(parentDir) { setStylesheet(screen.width < 512, parentDir); }

function switchStylesheet(parentDir)
{
  var switchAElement;

  switchAElement = document.getElementById("switchA");
  setStylesheet(switchAElement.innerHTML == "mobile", parentDir);
}

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
