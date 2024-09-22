const APP_MAIN = async (os, procInfo, args) => {
  const { div, applyStyle } = HtmlUtil;
  const { pid } = procInfo;
  let onClose = null;
  let promise = new Promise(res => { onClose = res; });
  os.Shell.showWindow(pid, {
    title: 'Process List',
    width: 400,
    height: 300,
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    onInit: (contentHost) => {
      let main = applyStyle(div(), { overflowX: 'hidden', overflowY: 'auto'});
      let items = [];
      let x = 0;
      contentHost.append(main);
      os.ProcessManager.setInterval(pid, () => {
        let procs = os.ProcessManager.getProcesses();
        while (items.length < procs.length) {
          let item = div();
          items.push(item);
          main.append(item);
          let killBtn = document.createElement('button');
          item.append(document.createElement('span'), killBtn);
          killBtn.addEventListener('click', () => {
            let pid = killBtn._PID;
            if (pid) os.ProcessManager.killProcess(pid);
          });
          killBtn.innerText = 'Kill Process';
        }
        while (items.length > procs.length) {
          let item = items.pop();
          main.removeChild(item);
        }
        for (let i = 0; i < procs.length; i++) {
          let label = items[i].children[0];
          let button = items[i].children[1];
          let proc = procs[i];
          button._PID = proc.pid;
          label.innerText = 'PID: ' + proc.pid + " App: " + proc.appId;
        }
      }, 200);
    },
  });
  return promise;
};
