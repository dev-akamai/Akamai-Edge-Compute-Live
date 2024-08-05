(() => {
  // <stdin>
  (function($, window2, document2) {
    const $html = $("html");
    const $win = $(window2);
    const $doc = $(document2);
    const $header = $(".header");
    $.event.special.widthResize = {
      setup: function() {
        const $this = $(this);
        $this.data("currentWidth", $this.width());
        $this.on("resize.widthResize", function() {
          const newWidth = $this.width();
          const prevWidth = $this.data("currentWidth");
          if (newWidth !== prevWidth) {
            $this.data("currentWidth", newWidth).trigger("widthResize");
          }
        });
      },
      teardown: function() {
        $(this).off("resize.widthResize");
      }
    };
    const getWindowHeight = () => $win.height();
    const getWindowWidth = () => $win.width();
    function setCSSVariable(name, value, unit = "", element = $html) {
      element.css(`--${name}`, `${value}${unit}`);
    }
    setCSSVariable("dvh", getWindowHeight() * 0.01, "px");
    setCSSVariable("current-dvh", getWindowHeight() * 0.01, "px");
    setCSSVariable("dvw", getWindowWidth(), "px");
    setCSSVariable("header-height", $header.outerHeight(), "px");
    $win.on("resize", function() {
      setCSSVariable("current-dvh", getWindowHeight() * 0.01, "px");
      setCSSVariable("header-height", $header.outerHeight(), "px");
    });
    $win.on("widthResize", function() {
      setCSSVariable("dvh", getWindowHeight() * 0.01, "px");
      setCSSVariable("dvw", getWindowWidth(), "px");
    });
    function formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    function getGitHubApiUrl(gitUrl, filePath) {
      const matches = gitUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (matches) {
        const owner = matches[1];
        const repo = matches[2];
        return `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filePath)}`;
      }
      return null;
    }
    function getFilePathFromGitUrl(gitUrl) {
      const matches = gitUrl.match(/github\.com\/[^\/]+\/[^\/]+\/tree\/[^\/]+\/(.+)/);
      if (matches) {
        const filePath = matches[1];
        return decodeURIComponent(filePath);
      }
      return null;
    }
    function fetchCodeBlock(url) {
      return new Promise((resolve, reject) => {
        $.ajax({
          url,
          dataType: "text",
          success: function(data) {
            try {
              resolve(data);
            } catch (e) {
              reject(new Error("Failed to stringify data: " + e.message));
            }
          },
          error: function(xhr, status, error) {
            reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
          }
        });
      });
    }
    function switchTab() {
      const $this = $(this);
      const $target = $this.data("target");
      const $tabs = $this.closest(".js-tabs").find(".tab");
      $this.parent().addClass("current").siblings().removeClass("current");
      if ($target == "*") {
        $tabs.addClass("current");
      } else {
        $tabs.eq($target - 1).addClass("current").siblings().removeClass("current");
      }
    }
    $(".js-tabs .tabs__nav span").on("click", switchTab);
    let copyTimeout;
    $(".js-copy-code").on("click", function() {
      const $tabs = $(this).closest(".tabs-code");
      const $codeElement = $tabs.find(".js-entry-code code").text();
      const $temp = $("<textarea>").css({
        position: "absolute",
        left: "-9999px",
        opacity: "0"
      }).val($codeElement);
      $("body").append($temp);
      $temp.select();
      document2.execCommand("copy");
      $temp.remove();
      clearTimeout(copyTimeout);
      $tabs.addClass("copied");
      copyTimeout = setTimeout(() => {
        $tabs.removeClass("copied");
      }, 1e3);
    });
    $("pre[data-ajax]").each(function() {
      const gitUrl = $(this).data("ajax");
      const filePath = "main.js";
      const apiUrl = `https://raw.githubusercontent.com${gitUrl.replace("https://github.com", "").replace("/tree", "")}/${filePath}`;
      const $codeContainer = $(this).find("code");
      fetchCodeBlock(apiUrl).then((codeBlocks) => {
        $codeContainer.text(codeBlocks);
        Prism.highlightElement($codeContainer[0]);
      }).catch((error) => {
        console.error(error);
      });
    });
    $(document2).ready(function() {
      $(".js-time-updated").each(function() {
        const $this = $(this);
        const gitUrl = $this.data("api-url");
        if (gitUrl) {
          const filePath = getFilePathFromGitUrl(gitUrl);
          if (filePath) {
            const apiUrl = getGitHubApiUrl(gitUrl, filePath);
            if (apiUrl) {
              $.getJSON(apiUrl, function(data) {
                if (data && data.length > 0) {
                  const lastCommitDate = new Date(data[0].commit.committer.date);
                  $this.text(formatDate(lastCommitDate.toISOString()));
                } else {
                  $this.text("No updates found");
                }
              }).fail(function() {
                $this.text("Error fetching data");
              });
            } else {
              $this.text("Invalid GitHub URL");
            }
          } else {
            $this.text("Invalid file path in GitHub URL");
          }
        } else {
          $this.text("GitHub URL is empty");
        }
      });
    });
  })(jQuery, window, document);
})();
