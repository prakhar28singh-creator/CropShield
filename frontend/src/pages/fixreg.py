import re, io
p = 'CropRegistration.jsx'
d = io.open(p, encoding='utf-8').read()
orig = d
d = d.replace('<div className="form-grid">', '<div className="reg-grid">')
d = d.replace("'err-input'", "'input-err'")
d = d.replace('<div className="form-section" style={{ marginBottom: 0 }}>', '<div className="reg-section">')
d = d.replace('<div className="form-section">', '<div className="reg-section">')
d = re.sub(r'<div className="form-section-title">(.*?)</div>', r'<h3 className="reg-section-title">\1</h3>', d)
d = d.replace('<div style={{ display: \'flex\', gap: 8, justifyContent: \'flex-end\', padding: \'14px 20px\', borderTop: \'1px solid var(--border)\' }}>', '<div className="reg-foot">')
old_sel = '<Field id="crop" label="Crop" required>\n                  <select id="crop"'
new_sel = '<Field id="crop" label="Crop" required>\n                  {cropsLoading ? <div className="reg-skel" style={{ height: 46 }} /> : (\n                  <select id="crop"'
assert old_sel in d, 'crop select anchor missing'
d = d.replace(old_sel, new_sel)
old_end = ']).map(c => <option key={c.key} value={c.key}>{c.display_name}</option>)}\n                  </select>\n                </Field>'
new_end = ']).map(c => <option key={c.key} value={c.key}>{c.display_name}</option>)}\n                  </select>)}\n                </Field>'
assert old_end in d, 'crop select end missing'
d = d.replace(old_end, new_end)
io.open(p, 'w', encoding='utf-8').write(d)
print('OK changed:', d != orig, 'len:', len(d))
