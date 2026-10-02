import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: Request) {
  try {
    const pythonScript = path.resolve(process.cwd(), "../backend/train.py"); // Example path to training script
    
    return new Promise<NextResponse>((resolve) => {
      const proc = spawn("python", [pythonScript, "--auto"], {
        cwd: path.resolve(process.cwd(), "../backend"),
      });

      let output = "";
      
      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        output += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ success: true, log: output }));
        } else {
          resolve(NextResponse.json({ success: false, error: "Training failed", log: output }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
