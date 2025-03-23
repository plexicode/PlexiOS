import base64
import json
import os
import sys

BASIC_TEMPLATES_DIR = 'gen/templates'
FULL_CONCAT_DIR = 'gen/testing/full_concat'
MODULES_B64_IMAGES_DIR = 'gen/testing/modules_b64'
MODULES_IMAGE_FILES_DIR = 'gen/testing/modules_images'

SKIP_THESE = (
  'lib/jszip.min.js',
  'components/Zip.js'
)

REQUIRED_COMPONENTS = (
  'ItemList',
  'TreeList',
  'FileList',
  'IconBrowser',
  'DividerPane',
  'FileContextMenu',
)

APP_IDS = (
  'draw',
  'fileprops',
  'files',
  'imageviewer',
  'minesweeper',
  'notepad',
  'openwith',
  'plexic',
  'proclist',
  'screensaver',
  'settings',
  'skiflea',
  'sleep',
  'solitaire',
  'terminal',
  'themeloader',
  'vislog',
  'youtube',
)

def to_canonical_path(path):
  return path.replace('\\', '/')

def to_real_path(path):
  return path.replace('\\', '/').replace('/', os.sep)

def file_read_bytes(path):
  c = open(to_real_path(path), 'rb')
  bytes = c.read()
  c.close()
  return bytes

def file_read_base64(path):
  bytes = file_read_bytes(path)
  return base64.b64encode(bytes).decode('utf-8')

def file_read_text(path):
  return file_read_bytes(path).decode('utf-8')

def file_write_bytes(path, bytes):
  c = open(to_real_path(path), 'wb')
  c.write(bytes)
  c.close()

def file_write_text(path, content):
  return file_write_bytes(path, content.encode('utf-8'))

def list_files_recursively(root):
  acc = []
  _list_files_rec_impl('', to_canonical_path(root), acc)
  return acc

def _list_files_rec_impl(rel, abs, acc):
  for file in os.listdir(abs):
    file_rel = file if rel == '' else (rel + '/' + file)
    file_abs = abs + '/' + file
    if os.path.isdir(file_abs):
      _list_files_rec_impl(file_rel, file_abs, acc)
    else:
      acc.append(file_rel)

def file_get_parent(path):
  return os.sep.join(path.replace('\\', '/').split('/')[:-1])

def ensure_directory_exists(path):
  os.makedirs(path.replace('/', os.sep), exist_ok = True)

def get_hacky_inclusion_chunks(text, func_name):
  parts = text.split(func_name + '(\'')
  if len(parts) == 1: return [text]
  chunks = [parts[0]]
  for i in range(1, len(parts)):
    part = parts[i]
    first_apos = part.find('\'')
    if first_apos == -1 or part[first_apos + 1] != ')':
      raise Exception()
    path = part[:first_apos]
    rest = part[first_apos + len('\')'):]
    chunks.append(path)
    chunks.append(rest)
  return chunks

def hacky_perform_image_b64_inclusion(text):
  # PLEXI_IMAGE_B64('path/to/image.png') --> 'iVBORw0KGgoA...'
  parts = get_hacky_inclusion_chunks(text, 'PLEXI_IMAGE_B64')
  sb = [parts[0]]
  for i in range(1, len(parts), 2):
    path = parts[i]
    code = parts[i + 1]
    image_b64 = file_read_base64(to_real_path(path))
    sb.append('\'')
    sb.append(image_b64)
    sb.append('\'')
    sb.append(code)

  return ''.join(sb)

def hacky_perform_text_inclusion(text):

  # PLEXI_TEXT_INCLUDE('path/to/file.js') --> drops the contents directly in that line.

  while True:
    parts = get_hacky_inclusion_chunks(text, 'PLEXI_TEXT_INCLUDE')
    if len(parts) == 1:
      return parts[0]

    sb = [parts[0]]
    for i in range(1, len(parts), 2):
      path = parts[i]
      rest = parts[i + 1]
      sb.append(file_read_text(to_real_path(path)))
      sb.append(rest)
    text = ''.join(sb)

def hacky_inclusions(code):
  code = code.replace('\r\n', '\n').strip()
  code = hacky_perform_text_inclusion(code)
  return code + '\n'

def generate_html_host():
  scripts = [
    './plexios.js',
  ]
  loaders = '''
    PlexiOS.registerJavaScriptLoader('app', id => PlexiOS.Util.loadScript('./tools/' + id.split('.').pop() + '.js'));
    PlexiOS.registerJavaScriptLoader('component', id => PlexiOS.Util.loadScript('./components/' + id.split('.').pop() + '.js'));
    PlexiOS.registerJavaScriptLoader('image', id => PlexiOS.Util.loadScript('./images/' + id + '.js'));
  '''

  files_dir = '.'
  config = {
    'headless': False,
    'useDefaultFullScreenShell': True,
    'images': ['devbasic', 'plexiscriptapps'],
  }

  scripts = list(map(lambda path: '<script src="' + path + '"></script>\n', scripts))

  html = ''.join(['''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Plexi OS Test Page</title>
    ''', '\n'.join(scripts), '''
    <script>
let os;
let fs;
window.addEventListener('load', async () => {
  let filesDir = ''', "'", files_dir, "'", ''';

  ''', loaders, '''

  const config = ''', json.dumps(config), ''';

  os = await PlexiOS.create(config);
  fs = os.FsRoot;
});

    </script>
  </head>
  <body>

  </body>
</html>''']).strip()

  return html

def export_tool_app(id):
  full_id = 'io.plexi.tools.' + id
  src_path = 'tools/' + id
  metadata_path = src_path + '/metadata.json'
  metadata = json.loads(file_read_text(metadata_path))
  code_files = []
  image_files = []
  for file in list_files_recursively(src_path):
    if file.endswith('.js'):
      code_files.append(file)
    elif file.endswith('.png') or file.endswith('.jpg'):
      image_files.append(file)
  main_code_sb = [
    '(async () => {',
    'const { Util, HtmlUtil } = PlexiOS;',
    'const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({\n',
  ]
  for image in image_files:
    main_code_sb.append('  \'' + image + '\': \'' + file_read_base64(src_path + '/' + image) + '\',')
  main_code_sb.append('});\n')

  for file in code_files:
    main_code_sb.append(file_read_text(src_path + '/' + file).strip())

  main_code_sb += [
    'PlexiOS.registerJavaScript(\'app\', \'' + full_id + '\', APP_MAIN);',
    '})();',
    '',
  ]
  main_code = hacky_inclusions('\n'.join(main_code_sb))

  metadata_code = ''.join([
    'PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64(\'', 'tools/' + id + '/icon.png\')).then(icon => {\n',
    '  PlexiOS.staticAppRegistry.registerAppMetadata(\'' + full_id + '\', ', json.dumps(metadata['name']), ', icon);\n'
    '});\n',
  ])
  metadata_code = hacky_inclusions(metadata_code)

  file_write_text(BASIC_TEMPLATES_DIR + '/tools/' + id + '_app.js', main_code)
  file_write_text(BASIC_TEMPLATES_DIR + '/tools/' + id + '_metadata.js', metadata_code)

def generate_basic_templates():
  files = list_files_recursively('src')
  files.sort()
  files = list(filter(lambda f: f.endswith('.js'), files))

  lookup = {}
  sort_keys = []

  skip_list = set(SKIP_THESE)
  skip_comps = set(REQUIRED_COMPONENTS) # will be embedded directly. Will NEVER need to be included separately.

  for path in files:
    if path in skip_list: continue

    code = hacky_inclusions(file_read_text(to_real_path('src/' + path)))

    sort_key = path
    if path.startswith('util/'):
      if path.endswith('util.js'):
        sort_key = '0' + sort_key
      else:
        sort_key = '1' + sort_key
    elif path.startswith('components/'):
      comp_id = '.'.join(path.split('/').pop().split('.')[:-1])
      if comp_id not in skip_comps:
        file_write_text(BASIC_TEMPLATES_DIR + '/components/' + comp_id + '.js', code)
      continue # do not include in the lookup
    else:
      sort_key = '2' + sort_key

    lookup[sort_key] = code
    sort_keys.append(sort_key)

  sort_keys.sort()

  sb = []
  for sk in sort_keys:
    sb.append('\n')
    sb.append(lookup[sk])
    sb.append('\n')
  consolidated = ''.join(sb)

  exported_items = (
    'Util',
    'HtmlUtil',
    'PlexiFS',
    'create: createPlexiOs',
    'staticAppRegistry',
    'awaitAllJavaScriptLoaders',
    'registerJavaScriptLoader',
    'registerJavaScript',
    'loadJavaScript',
    'lockJavaScriptLoader',
    'createImageUtil',
    'terminalSession',
  )

  comp_included_code = []
  for comp in REQUIRED_COMPONENTS:
    comp_included_code.append(hacky_inclusions(file_read_text('src/components/' + comp + '.js')))

  final_base_os_code = ''.join([
    'const PlexiOS = (() => {\n',
    consolidated,
    '\n',
    'let PlexiOS = { Util, HtmlUtil, registerJavaScript };\n', # for required components
    '\n'.join(comp_included_code),
    '\nreturn Object.freeze({ ',
    ', '.join(exported_items),
    ' });\n',
    '})();\n'
  ]).replace('\r\n', '\n')

  file_write_text(BASIC_TEMPLATES_DIR + '/plexios_base.js', final_base_os_code)

  for path in list_files_recursively('images'):
    if not path.endswith('.js'): continue
    image_code = hacky_inclusions(file_read_text('images/' + path))
    image_id = '.'.join(path.split('.')[:-1])
    file_write_text(BASIC_TEMPLATES_DIR + '/images/' + image_id + '.js', image_code)

  for path in list_files_recursively('themes'):
    if not path.endswith('.js'): continue
    theme_code = hacky_inclusions(file_read_text('themes/' + path))
    theme_id = '.'.join(path.split('.')[:-1])
    file_write_text(BASIC_TEMPLATES_DIR + '/themes/' + theme_id + '.js', theme_code)

  for app_id in APP_IDS:
    export_tool_app(app_id)

def generate_modules_b64(templates):
  all_paths = list(templates.keys())
  all_paths.sort()
  base_code = [templates['plexios_base.js']]
  output = {}
  for path in all_paths:
    code = templates[path]
    if path.startswith('tools/'):
      if path.endswith('_metadata.js'):
        base_code.append(code)
      elif path.endswith('_app.js'):
        id = path.split('/').pop().split('_')[0]
        output['tools/' + id + '.js'] = code
    elif path.startswith('images/'):
      if path.endswith('/default.js'):
        base_code.append(code)
      else:
        output[path] = code
    elif path.startswith('themes/'):
      if path.endswith('/default.js'):
        base_code.append(code)
      else:
        output[path] = code
    elif path.startswith('components/'):
      output[path] = code
  base_code.append('\n')
  output['plexios.js'] = '\n'.join(base_code)
  output['test.html'] = generate_html_host()
  export_lookup_to_dir(output, MODULES_B64_IMAGES_DIR)

STRING_TYPE = type('')
def export_lookup_to_dir(files, dir):

  for file in files:
    content = files[file]
    full_path = dir + '/' + file
    parent_path = file_get_parent(full_path)
    ensure_directory_exists(parent_path)
    if type(content) == STRING_TYPE:
      file_write_text(full_path, hacky_perform_image_b64_inclusion(content))
    else:
      raise Exception() # TODO: image export when the time comes

def main(args):
  if len(args) != 1:
    print("Usage: python build.py action")
    print("Actions:")
    print("  templates - fills gen/templates with basic files.")
    print("  mod64 - builds test files that are separated into granular modules and has embedded base64 images")
    return

  arg = args[0]
  if arg == 'templates':
    generate_basic_templates()
  else:
    templates = list_files_recursively('gen/templates')
    templates_lookup = {}
    for path in templates:
      templates_lookup[path] = file_read_text('gen/templates/' + path)
    if arg == 'mod64':
      generate_modules_b64(templates_lookup)
    else:
      print("Unrecognized argument or not implemented yet: " + arg)

if __name__ == '__main__':
  main(sys.argv[1:])
