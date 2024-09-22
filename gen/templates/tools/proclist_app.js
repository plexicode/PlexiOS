(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAdlSURBVHhe7ZtrTJNnFMdPKRcBC15hBZF6AbKAlw+ABJGLxsQ4psbEiDhlujinfkAx+8CWTfdhGzEuaPxggn5QJmEkRjeNLjE6UNmmIZkaNXhBBARBBFGEIhd5ds5535YWHKUtfVtZf8mfvu/Tp4X3POec5wq4cePGzf8ZlfxqC3Go6aipKB8qQATqKaoTpUe9Rr1FDUcHqgZlqZ5DsNUAH6POSJejQi+qGvUQ1UcFNuCJmo/6HfU5FYwEWw2Qg/opPz8f4uPjwc/Pjwv7+/vhyZMnIISAnp4eePbsGbx9O3zDvnr1Ch48eAD37t2Dmpoai/X/Cw8PD2hvb6fPl+FtmlTqOH7x9PQUTU1N+KyuQ3h4OIVgqfQnjgwP+dVaIkJDQyE4OBiOHDkCqampZsrIyIDXryn8xyYUNp3p6elsdTSC8FWpRJjakxWg8qBWENeuXeP3Cb1eL4qLiwWGhVziGJTygCkov6ioKI45ivPVvuPhplbH+kIzgSuRdxg4c+YMrFu3DmbMmMHlEyZMGFaTJk2CPXv2yJ92LLYYIIp+oLWho4N6MABvlQrq+nqgqrcHKnu7uczHx9AzAixcuJBFYTN//vwhITNYycnJbCxXZRNKXLhwQTQ3N7O7D9bkyZMd7u7vwpYQsKUb/A717aNHj7iVDh06BC9evJDeQaKjoyEhIQHCwsLkEuXQ6XRQW1vr8G7wKEq8efNGtrvroFgS9Pf3N8Z4XV0dTJw4EVSYBwwKDAyEs2fP8vuuji0h8HdkZGTC/fv3+WbDhg1QdLIY/BO1fE90/FEPWVlZcOzYMbkEoKGhAR4+pJGu9VRXVwPmG0Cvk0sA5s6dC6tXr5bvJJQKgealS5fKTidEXFyc8Az2EzN/SzcK6wg0gFxDArtNY5IcDWGPIn/zAEokQfL7zo0bN6qPHz/OBZjxQT9NBdq9C6CvpQu6q15B875/hnhAeXk5VFVVyXfWERISwknV19dXLgEOMwo9U5TwgECUyM7OZovjQGhIyxiUl5fHdZRECQ8IRdXv3r0b9u/fzwW5ubnQ2NjI19RSMTExLIpRpVHCA+ahBE6DZZu7Fkp1g2MKuwyARufp8Pbt2yEpKQlmz57Nbkivhw8flmuNLZahRGFhIbvcnTt3jEkvROMpEsPGiZRwX+GjVomUlBSuoyRKhAAP/zQaDd/09tJSHkDekinQkDML/twcDmWfTocPxqu5fDBr1qzh2aCp5syZw11ca2urXEtZRiUH+HhKnUmLvg9qXvZCXz/fmoENZJw+m6JWq3mqTMPr94GVKHH69Gl2ubKyMnZ/bHGh8VYZw4G0fPlyrqMkivcCFAozZ86EgJBZkLRkGSdDWsmh1eKjR2nSOPYw8wBXwyXGAU+fPoWLFy/aPPNTGrsNsHjxYrO1AFr3w9kiYA6Qa7g2dhmgs7MTSktL4cNpOshK+4iVsyITdEFaYxfp6lg7GaIc8CvmAFi1ahW8fPmSp6TZ6WvhwGbaLZNI/WYb1HS08laXKZQcb926Jd8Npa+vD5qammDr1q08ZrAWJSZDZkmwra2Nu7z02CRx8ssfxcHPckT+pl0ifKqWE9JgRrIogjNKgTNN+RMjp7u7W9B2HX7HzyiHYWYA2vHx8JB2ggYrMzOT6yiFoTFQ+agRY1cOoBWaq1evAoUEqaKiAm7cuME9QVFRkVzLtbG7F0hMTOSMjy7PQ13KC2SEK1euyDXGFmYh0N/fL06dOiW0Wq2Z+5MoNJTEKSFALk9L040tbWiaXQBbDkqKiOfDEu8DdnWDOBmCtDTsceihF62VahAF2QDlJTwDNOX69etQUlJitXECAgIgMjKSuzmae9Da42AMXTJyAIWt4RjMQgAHQZLbbTkooLBJ0r6/BEQlcPlgdu7caXBTu1RQUCB/4wC2hsDoeEB0MoCPH0DtHYDWeq5ILUUbqKbQ+R9bTo7Q5uvdu3ehvr6eX2nPIS6ODqkN4BQPuHnzprFV/P39RWxsrMjJyRHnz5/nrXMlsdUDrMXMAERlZaXAIa985zycEgLEiRMneEJkON7m7e3N7k+zwvXr1/PxNSVwSgjgbNBg9XcKR4lcTwmcMg6gw5BE9jb8ze2SXjcCbPqEi9kLTMG/E27fvg2YOyzKWavEljDzgOfPn7PVd27HZ2sf0JJUEBqNhuuYcu7cOaN3WJJarRaXLl2SP2kZp+QAOuJKx+X25gLsQRnQxQCE65Lh8uXLcokEdYG0ZW7pOCw+D3839igQEREhlw6PUjmAT4gZWgYfkK0+bhyIwMABqVSg+M6QUjmAjsfzkJSgbL9gwQIclCyC1NSVRq1YsRIyMzO5zliDjm+Kx48fy3Z3HRTtBVpaWjjmSLSO9z5jbRL8CvW9dCnh5eVl/H8BA7RjRBueNCgKCgri/b+uri6e1c2bN4/PFY02er0eduzYQZdWJUFrDUAnoDNQlAsM3hOEMrcA2gBFTzkeRYerDdAOqJd06TB+QH0tXVrGWgPYC22vR6Ok/fXRh3JABaqL79y4cePGjZthAPgXYX1CSChvSw8AAAAASUVORK5CYII=',
});

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
PlexiOS.registerJavaScript('app', 'io.plexi.tools.proclist', APP_MAIN);
})();
