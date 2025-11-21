import React from 'react';
import { DiffHunk, DiffLine } from '../types';
import './DiffViewer.css';

export interface DiffViewerProps {
  hunks: DiffHunk[];
  filePath: string;
  onLineClick?: (line: DiffLine) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ hunks, filePath, onLineClick }) => {
  return (
    <div className="diff-viewer">
      <div className="diff-viewer__header">
        <i className="codicon codicon-file-code" />
        <span className="diff-viewer__file-path">{filePath}</span>
      </div>
      <div className="diff-viewer__content">
        {hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex} className="diff-hunk">
            <div className="diff-hunk__header">
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>
            <table className="diff-table">
              <tbody>
                {hunk.lines.map((line, lineIndex) => (
                  <tr
                    key={lineIndex}
                    className={`diff-line diff-line--${line.type}`}
                    onClick={() => onLineClick?.(line)}
                  >
                    <td className="diff-line__number diff-line__number--old">
                      {line.oldLineNumber}
                    </td>
                    <td className="diff-line__number diff-line__number--new">
                      {line.newLineNumber}
                    </td>
                    <td className="diff-line__indicator">
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                    </td>
                    <td className="diff-line__content">
                      <code>{line.content}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};
