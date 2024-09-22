(() => {

PLEXI_TEXT_INCLUDE('src/lib/jszip.min.js')

  let regProps = [];
  PlexiOS.HtmlUtil.registerComponent('Zip', (...args) => {
    return new JSZip();
  });
});
