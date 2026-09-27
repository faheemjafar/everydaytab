"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { ChoiceGrid, PdfTool, downloadFile, suffixName, usePdfFile } from "@/components/tool";

const ROTATION_OPTIONS = [
  { label: "90° clockwise", value: 90 },
  { label: "180°", value: 180 },
  { label: "90° counter-clockwise", value: 270 },
];

export default function RotatePDF() {
  const [rotation, setRotation] = useState(90);
  const pdf = usePdfFile();

  const rotate = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      doc.getPages().forEach((page) => page.setRotation(degrees(page.getRotation().angle + rotation)));
      downloadFile(await doc.save(), suffixName(pdf.file, `rotated-${rotation}`));
    }, "Failed to rotate PDF.");

  return (
    <ToolLayout toolId="rotate-pdf">
      <PdfTool
        pdf={pdf}
        optionsTitle="Rotation"
        options={
          <ChoiceGrid
            value={rotation}
            onChange={setRotation}
            options={ROTATION_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
              icon: <RotateCw className="w-5 h-5" style={{ transform: `rotate(${o.value === 270 ? -90 : o.value}deg)` }} />,
            }))}
          />
        }
        action={{ label: "Rotate all pages", busyLabel: "Rotating…", icon: <RotateCw />, onClick: rotate }}
      />
    </ToolLayout>
  );
}
