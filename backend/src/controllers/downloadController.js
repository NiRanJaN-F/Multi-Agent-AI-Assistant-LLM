import archiver from 'archiver';
import { fetchProjectFiles } from '../services/aiEngineService.js';

/**
 * GET /api/agents/projects/:projectName/download
 * Downloads a generated project as a .zip archive
 */
export async function downloadProjectZip(req, res, next) {
  try {
    const projectName = req.params.projectName || req.params.name;
    if (!projectName || !String(projectName).trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'projectName parameter is required',
      });
    }

    const cleanName = String(projectName).trim();
    let data;
    try {
      data = await fetchProjectFiles(cleanName);
    } catch (err) {
      return res.status(err.statusCode || 404).json({
        status: 'error',
        message: err.message || Project '' not found,
      });
    }

    const files = data?.files || {};
    const fileEntries = Object.entries(files);

    if (fileEntries.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: Project '' has no files to archive,
      });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      ttachment; filename=\ \
    );

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      console.error('[download] Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ status: 'error', message: 'Failed to create archive' });
      }
    });

    archive.pipe(res);

    for (const [filePath, content] of fileEntries) {
      archive.append(content, { name: filePath });
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
}
