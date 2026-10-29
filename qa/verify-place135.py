"""Verify the final Codex135 package structure; never install or read producer data."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import struct
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
VERSION = "0.12.135"
CODE = 176
PACKAGE = "br.com.territorio.gestao2"
LABEL = "AGRO Gestão Codex"
BRIDGES = {"cordova.js", "cordova_plugins.js"}
VISUALIZATIONS = Path("C:/Users/alexd/.codex/visualizations/2026/10/28/01a1835c-018b-7352-95a2-037da69102a6")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(*args: object) -> str:
    result = subprocess.run([str(x) for x in args], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    require(result.returncode == 0, "Verification command failed: " + str(args[0]) + "\n" + result.stdout[-2500:] + result.stderr[-2500:])
    return result.stdout


def signature(java: Path, jar: Path, apk: Path) -> dict:
    output = run(java, "-jar", jar, "verify", "--verbose", "--print-certs", apk)
    digest = re.search(r"Signer #1 certificate SHA-256 digest: ([0-9a-fA-F]{64})", output)
    require(digest is not None, "Signing certificate SHA-256 was not returned")
    require("Number of signers: 1" in output, "Expected exactly one APK signer")
    return {
        "certificateSHA256": digest.group(1).lower(),
        "v2": "Verified using v2 scheme (APK Signature Scheme v2): true" in output,
        "v3": "Verified using v3 scheme (APK Signature Scheme v3): true" in output,
    }


def elf_segments(blob: bytes, name: str) -> dict:
    require(blob[:4] == b"\x7fELF" and blob[4] in (1, 2) and blob[5] in (1, 2), "Invalid ELF: " + name)
    wide = blob[4] == 2
    endian = "<" if blob[5] == 1 else ">"
    offset = struct.unpack_from(endian + ("Q" if wide else "I"), blob, 32 if wide else 28)[0]
    size, count = struct.unpack_from(endian + "HH", blob, 54 if wide else 42)
    require(size >= (56 if wide else 32) and offset + size * count <= len(blob), "Invalid ELF program header table: " + name)
    loads = []
    for i in range(count):
        at = offset + size * i
        if struct.unpack_from(endian + "I", blob, at)[0] != 1:
            continue
        file_offset, address = struct.unpack_from(endian + ("QQ" if wide else "II"), blob, at + (8 if wide else 4))
        alignment = struct.unpack_from(endian + ("Q" if wide else "I"), blob, at + (48 if wide else 28))[0]
        require(alignment >= 16384 and (address - file_offset) % 16384 == 0, "ELF PT_LOAD is not structurally 16 KB compatible: " + name)
        loads.append({"fileOffset": file_offset, "virtualAddress": address, "alignment": alignment})
    require(bool(loads), "No ELF PT_LOAD segments found: " + name)
    return {"path": name, "bits": 64 if wide else 32, "loadSegments": loads}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apk", type=Path, default=ROOT / "AGRO-Gestao-Codex-0.12.135.apk")
    parser.add_argument("--baseline", type=Path, default=ROOT / "AGRO-Gestao-Codex-0.12.134.apk")
    parser.add_argument("--sdk", type=Path, default=ROOT.parent / "New project/android-sdk")
    parser.add_argument("--build-log", type=Path, default=ROOT / "qa/place135-build.log")
    args = parser.parse_args()
    apk, baseline, dist = args.apk.resolve(), args.baseline.resolve(), ROOT / "app/dist"
    require(apk.is_file() and baseline.is_file() and dist.is_dir(), "APK, baseline or dist is missing")
    log = args.build_log.read_text(encoding="utf-8-sig")
    evidence = re.findall(r"^Build evidence:\s*(.+?)\s*$", log, re.MULTILINE)
    require(bool(evidence) and "BUILD SUCCESSFUL" in log, "The final Android build has not finished successfully")
    build_dir = Path(evidence[-1]).resolve()
    require(build_dir.is_relative_to(VISUALIZATIONS.resolve()) and str(build_dir).isascii(), "Inspection directory must be inside the authorized ASCII visualization workspace")
    inspection = build_dir / "signed.apk"
    require(inspection.is_file(), "Build inspection copy is missing")
    apk_hash = sha256(apk)
    require(sha256(inspection) == apk_hash, "Inspection copy differs from final APK")
    require(apk_hash.upper() in log.upper(), "Build log does not identify this final APK hash")
    before_size = apk.stat().st_size
    tools = args.sdk / "build-tools/36.0.0"
    java = Path("C:/Program Files/Microsoft/jdk-21.0.12.101-hotspot/bin/java.exe")
    badging = run(tools / "aapt.exe", "dump", "badging", inspection)
    require(f"package: name='{PACKAGE}' versionCode='{CODE}' versionName='{VERSION}'" in badging, "Android identity/version does not match Codex135")
    require(f"application: label='{LABEL}'" in badging and "application-debuggable" not in badging, "Unexpected app label or debuggable production package")
    final_signature = signature(java, tools / "lib/apksigner.jar", inspection)
    baseline_copy = build_dir / "baseline-codex134-verification.apk"
    shutil.copyfile(baseline, baseline_copy)
    require(sha256(baseline_copy) == sha256(baseline), "Baseline inspection copy differs")
    old_signature = signature(java, tools / "lib/apksigner.jar", baseline_copy)
    require(final_signature["v2"] and final_signature["v3"], "APK must verify with v2 and v3 signatures")
    require(final_signature["certificateSHA256"] == old_signature["certificateSHA256"], "Signing certificate changed from installed Codex134 baseline")
    run(tools / "zipalign.exe", "-c", "-P", "16", "4", inspection)
    assets = {}
    native = []
    with ZipFile(apk) as zipped:
        require(zipped.testzip() is None, "ZIP CRC verification failed")
        names = [row.filename for row in zipped.infolist() if not row.is_dir()]
        require(len(names) == len(set(names)), "Duplicate ZIP entries are not allowed")
        packaged = {name.removeprefix("assets/public/") for name in names if name.startswith("assets/public/")}
        files = sorted(path for path in dist.rglob("*") if path.is_file())
        require(bool(files), "No dist assets found")
        expected = {path.relative_to(dist).as_posix() for path in files}
        missing, extra = expected - packaged, packaged - expected
        require(not missing, "Missing compiled APK assets: " + ", ".join(sorted(missing)))
        require(extra <= BRIDGES, "Unexpected public assets in APK: " + ", ".join(sorted(extra)))
        for path in files:
            relative = path.relative_to(dist).as_posix()
            blob = path.read_bytes()
            require(zipped.read("assets/public/" + relative) == blob, "Compiled asset differs: " + relative)
            assets[relative] = hashlib.sha256(blob).hexdigest()
        config = json.loads(zipped.read("assets/capacitor.config.json"))
        require(config.get("appId") == PACKAGE and config.get("appName") == LABEL and config.get("webDir") == "dist", "Packaged Capacitor identity is not Codex")
        with apk.open("rb") as raw:
            for row in zipped.infolist():
                if not row.filename.startswith("lib/") or not row.filename.endswith(".so"):
                    continue
                record = elf_segments(zipped.read(row), row.filename)
                raw.seek(row.header_offset)
                header = raw.read(30)
                require(header[:4] == b"PK\x03\x04", "Invalid ZIP local header")
                name_len, extra_len = struct.unpack_from("<HH", header, 26)
                data_offset = row.header_offset + 30 + name_len + extra_len
                record.update({"storedUncompressed": row.compress_type == ZIP_STORED, "zipDataOffset": data_offset})
                if record["storedUncompressed"]:
                    require(data_offset % 16384 == 0, "Uncompressed native library ZIP position is not 16 KB aligned: " + row.filename)
                native.append(record)
    require(bool(native), "Expected native libraries are missing")
    require(sha256(apk) == apk_hash and apk.stat().st_size == before_size, "APK changed during verification")
    report = {
        "version": VERSION, "versionCode": CODE, "package": PACKAGE, "label": LABEL,
        "scope": "package-structure-only", "status": "package-structure-verified",
        "checkedAtUTC": datetime.now(timezone.utc).isoformat(),
        "apk": str(apk), "buildEvidence": str(build_dir), "size": before_size, "sha256": apk_hash,
        "zipCRC": True, "duplicateZipEntries": False, "compiledAssetsMatch": True,
        "assetCount": len(assets), "assetSHA256": assets, "nativeBridgeAssets": sorted(extra),
        "unexpectedPublicAssets": [], "capacitorIdentityMatches": True, "debuggable": False,
        "certificateSHA256": final_signature["certificateSHA256"], "baselineVersion": "0.12.134",
        "baselineSHA256": sha256(baseline), "sameCertificateAsBaseline": True,
        "signatureV2": True, "signatureV3": True, "zipalign16KB": True,
        "ELF16KBStructural": True, "nativeLibraries": native,
        "runtime16KBMeasured": False, "nativeFPSMeasured": False, "basicPhoneMeasured": False,
        "hardwareValidationIncluded": False, "validatedForInstallation": False, "installed": False,
    }
    package_report = ROOT / "qa/place135-package-review.json"
    metadata = ROOT / "app/native-apk-validation-place-0.12.135.json"
    package_report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if metadata.exists():
        previous = json.loads(metadata.read_text(encoding="utf-8-sig"))
        require(not previous.get("installed"), "Installed metadata already exists; it must not be reset by package verification")
    metadata.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("status", "size", "sha256", "assetCount", "nativeBridgeAssets", "sameCertificateAsBaseline", "signatureV2", "signatureV3", "zipalign16KB", "ELF16KBStructural")}))


if __name__ == "__main__":
    main()
