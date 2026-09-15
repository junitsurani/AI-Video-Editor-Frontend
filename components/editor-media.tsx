"use client";
import { useState } from "react";
import { Plus, Trash2, LoaderCircle } from "lucide-react";
import { api, type Plan, type Project, type SupportingAsset } from "@/lib/studio";
import { uploadAsset } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import styles from "./editor-finishing.module.css";

type LibraryAsset = Pick<SupportingAsset, "id" | "name" | "description" | "role">;

export function EditorMedia({ project, plan, disabled, onReload, onApply }: {
  project: Project; plan?: Plan; disabled: boolean; onReload: () => Promise<void>;
  onApply: (plan: Plan) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"broll" | "sfx" | "reference">("broll");
  const [rights, setRights] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [library, setLibrary] = useState<LibraryAsset[] | null>(null);
  const [kind, setKind] = useState<"broll" | "sfx" | "graphics">("broll");
  const [assetId, setAssetId] = useState("");
  const [text, setText] = useState("");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("3");
  const [sourceStart, setSourceStart] = useState("0");
  const [layout, setLayout] = useState<"cover" | "split">("cover");
  const [position, setPosition] = useState<"top" | "center">("top");
  const [volume, setVolume] = useState("0.15");
  const busy = disabled || uploading;
  const total = plan?.cuts.reduce((sum, cut) => sum + cut.end - cut.start, 0) || 0;
  const assets = project.assets || [];

  async function upload() {
    if (!file) return;
    setUploading(true); setError(""); setProgress(0);
    try {
      await uploadAsset(file, project.id, { role, rights, description }, setProgress);
      setFile(null); setDescription("");
      await onReload();
    } catch (e) { setError((e as Error).message); }
    finally { setUploading(false); }
  }

  async function browse() {
    setError("");
    try { setLibrary((await api<{ assets: LibraryAsset[] }>(`/projects/${project.id}/assets/library`)).assets); }
    catch (e) { setError((e as Error).message); }
  }

  async function attach(id: string) {
    setUploading(true); setError("");
    try { await api(`/projects/${project.id}/assets/library/${id}`, "POST", {}); await onReload(); }
    catch (e) { setError((e as Error).message); }
    finally { setUploading(false); }
  }

  function addLayer() {
    if (!plan) return;
    setError("");
    const a = Number(start), b = Number(end), source = Number(sourceStart);
    if (!Number.isFinite(a + b + source) || a < 0 || b > total || b - a < .1 || source < 0) {
      setError("Choose valid times inside this edited video."); return;
    }
    if (kind === "graphics") {
      if (!text.trim()) { setError("Enter the text to show."); return; }
      onApply({ ...plan, graphics: [...(plan.graphics || []), { text: text.trim(), start: a, end: b, position }] });
    } else {
      const asset = assets.find(item => item.id === assetId && item.role === kind);
      if (!asset) { setError("Choose an asset from this project."); return; }
      if (asset.kind !== "image" && source + b - a > asset.duration + .05) {
        setError("The asset is too short for this placement. Shorten it or change its in point."); return;
      }
      onApply({ ...plan, [kind]: [...(plan[kind] || []), { asset_id: assetId, start: a, end: b, source_start: source,
        ...(kind === "broll" ? { layout } : { volume: Number(volume) }) }] });
    }
  }

  return <details className={styles.section}>
    <summary>Supporting media <span className={styles.note}>· {assets.length} assets</span></summary>
    <fieldset disabled={busy} className={styles.fields}>
      <p className={styles.note}>Add footage and sounds for the AI to use when relevant. A style reference guides captions and color using our available styles. Music stays in Style &amp; sound.</p>
      {assets.length > 0 && <ul className={styles.assetList}>{assets.map(asset => <li key={asset.id}>
        <a href={`/api/projects/${project.id}/assets/${asset.id}/media`} target="_blank" rel="noreferrer">{asset.name}</a>
        <span>{asset.role === "broll" ? "B-roll" : asset.role === "reference" ? "Style reference" : asset.role === "music" ? "Music" : "Sound effect"} · {asset.description}</span>
      </li>)}</ul>}
      <details>
        <summary className={styles.note}>Upload supporting media</summary>
        <div className={styles.mediaFields}>
          <label className={styles.field}>Use as<select value={role} onChange={e => { setRole(e.target.value as typeof role); setFile(null); }}><option value="broll">B-roll</option><option value="sfx">Sound effect</option><option value="reference">Style reference</option></select></label>
          <label className={styles.field}>File<input key={role} className={styles.file} type="file" accept={role === "sfx" ? ".mp3,.wav,.m4a" : ".mp4,.mov,.jpg,.jpeg,.png"} onChange={e => setFile(e.target.files?.[0] || null)} /></label>
          <label className={styles.field}>What does it show or sound like?<Input value={description} maxLength={500} onChange={e => setDescription(e.target.value)} placeholder="A close-up of the product on a white desk" /></label>
          <label className={styles.field}>Usage rights<select value={rights} onChange={e => setRights(e.target.value)}><option value="">Choose rights</option><option value="owned">I own this media</option><option value="licensed">I have a license</option><option value="permission">I have permission</option></select></label>
          <Button size="sm" variant="outline" disabled={!file || !rights || !description.trim() || busy} onClick={upload}>{uploading ? <LoaderCircle size={14} className="spin" /> : <Plus size={14} />} {uploading ? `Uploading ${progress}%` : "Upload asset"}</Button>
        </div>
      </details>
      <Button variant="ghost" size="sm" onClick={browse}>Browse studio library</Button>
      {library && (library.length ? <ul className={styles.assetList}>{library.map(asset => <li key={asset.id}><span>{asset.name} · {asset.description}</span><Button size="sm" variant="outline" onClick={() => attach(asset.id)}>Add to project</Button></li>)}</ul> : <p className={styles.note}>No studio assets have been added yet. You can upload your own above.</p>)}
      {plan && <>
        <details>
          <summary className={styles.note}>Place media or text</summary>
          <div className={styles.mediaFields}>
            <p className={styles.note}>Times refer to this edited video ({total.toFixed(1)}s). You can also describe placements in the edit prompt.</p>
            <label className={styles.field}>Layer<select value={kind} onChange={e => { setKind(e.target.value as typeof kind); setAssetId(""); }}><option value="broll">B-roll</option><option value="graphics">Text</option><option value="sfx">Sound effect</option></select></label>
            {kind === "graphics" ? <label className={styles.field}>Text<Input value={text} maxLength={160} onChange={e => setText(e.target.value)} /></label> : <label className={styles.field}>Asset<select value={assetId} onChange={e => setAssetId(e.target.value)}><option value="">Choose an asset</option>{assets.filter(a => a.role === kind).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
            <div className={styles.mediaTimes}><label className={styles.field}>Start (s)<Input type="number" min={0} max={total} step={.1} value={start} onChange={e => setStart(e.target.value)} /></label><label className={styles.field}>End (s)<Input type="number" min={.1} max={total} step={.1} value={end} onChange={e => setEnd(e.target.value)} /></label></div>
            {kind !== "graphics" && <label className={styles.field}>Asset in point (s)<Input type="number" min={0} step={.1} value={sourceStart} onChange={e => setSourceStart(e.target.value)} /></label>}
            {kind === "broll" && <label className={styles.field}>Layout<select value={layout} onChange={e => setLayout(e.target.value as typeof layout)}><option value="cover">Full frame</option><option value="split">50/50 split</option></select></label>}
            {kind === "graphics" && <label className={styles.field}>Position<select value={position} onChange={e => setPosition(e.target.value as typeof position)}><option value="top">Top</option><option value="center">Center</option></select></label>}
            {kind === "sfx" && <label className={styles.field}>Volume<Input type="number" min={0} max={.5} step={.05} value={volume} onChange={e => setVolume(e.target.value)} /></label>}
            <Button size="sm" variant="outline" onClick={addLayer}>Add to edit</Button>
          </div>
        </details>
        {(["broll", "graphics", "sfx"] as const).map(group => (plan[group] || []).map((layer, i) => <div className={styles.row} key={`${group}-${i}`}>
          <span>{group === "graphics" ? "Text" : group === "broll" ? "B-roll" : "Sound effect"} · {layer.start.toFixed(1)}–{layer.end.toFixed(1)}s</span>
          <Button variant="ghost" size="sm" aria-label={`Remove ${group} layer ${i + 1}`} onClick={() => onApply({ ...plan, [group]: plan[group]?.filter((_, index) => index !== i) })}><Trash2 size={14} /></Button>
        </div>))}
        <label className={styles.field}>Cut transitions<select value={plan.transition || "cut"} onChange={e => onApply({ ...plan, transition: e.target.value as "cut" | "dip" })}><option value="cut">Clean cuts</option><option value="dip">Brief dip to black</option></select></label>
      </>}
    </fieldset>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </details>;
}
