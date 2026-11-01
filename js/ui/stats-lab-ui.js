/**
 * UI - MARS Statistics Lab Modal
 * Dedicated subsystem for Descriptive Stats, Distributions, Probability, Regression and Inference
 */
window.MARS_UI = window.MARS_UI || {};

class StatsLabUI {
    static init() {
        this.modal = document.getElementById('stats-lab-modal');
        this.currentTab = 'descriptive';

        document.getElementById('btn-open-stats-lab')?.addEventListener('click', () => this.open());
        document.getElementById('btn-close-stats-lab')?.addEventListener('click', () => this.close());

        // Tab switching
        document.querySelectorAll('.stats-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.stats-tab-btn').forEach(b => {
                    b.classList.remove('active', 'border-amber-400', 'text-amber-300');
                    b.classList.add('text-slate-400');
                });
                btn.classList.add('active', 'border-amber-400', 'text-amber-300');
                btn.classList.remove('text-slate-400');

                this.currentTab = btn.dataset.tab;
                document.querySelectorAll('.stats-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`stats-tab-${this.currentTab}`)?.classList.remove('hidden');
                this.updatePreview();
            });
        });

        // Inputs
        document.getElementById('stats-raw-input')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('stats-reg-input')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('stats-dist-type')?.addEventListener('change', () => this.updatePreview());
        ['stats-dist-x', 'stats-dist-p1', 'stats-dist-p2'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updatePreview());
        });

        // Write actions
        document.getElementById('btn-write-stats-to-board')?.addEventListener('click', () => this.writeToBoard());
        document.getElementById('btn-plot-stats-chart')?.addEventListener('click', () => this.plotChartToBoard());
    }

    static open() {
        if (!this.modal) this.init();
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        this.updatePreview();
    }

    static close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }
    }

    static updatePreview() {
        const previewEl = document.getElementById('stats-steps-preview');
        if (!previewEl) return;

        if (this.currentTab === 'descriptive') {
            const raw = document.getElementById('stats-raw-input')?.value.trim();
            if (!raw) {
                previewEl.textContent = 'Digite ou cole uma lista de números separados por vírgula ou espaço (Ex: 12, 15, 14, 18, 19, 22, 25)...';
                return;
            }
            const res = window.MARS.statistics.analyzeDataset(raw);
            previewEl.textContent = `Estatística Descritiva:\n${res.primaryResult}\n\n` + res.detailLines.join('\n');
        } else if (this.currentTab === 'regression') {
            const raw = document.getElementById('stats-reg-input')?.value.trim();
            if (!raw) {
                previewEl.textContent = 'Digite pares de coordenadas (x,y) por linha (Ex: 1, 2.5 \\n 2, 4.8 \\n 3, 7.1)...';
                return;
            }
            const lines = raw.split('\n').filter(Boolean);
            const points = [];
            lines.forEach(l => {
                const parts = l.split(/[,;\s]+/).filter(Boolean).map(Number);
                if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
                    points.push({ x: parts[0], y: parts[1] });
                }
            });
            const res = window.MARS.statistics.analyzeBivariate(points);
            if (res) {
                previewEl.textContent = `Regressão Linear & Correlação (n = ${points.length}):\n\n` + res.detailLines.join('\n');
            } else {
                previewEl.textContent = 'Dados insuficientes ou inválidos para regressão linear (mínimo 2 pontos).';
            }
        } else if (this.currentTab === 'distribution') {
            const type = document.getElementById('stats-dist-type')?.value;
            const x = parseFloat(document.getElementById('stats-dist-x')?.value) || 0;
            const p1 = parseFloat(document.getElementById('stats-dist-p1')?.value) || 0;
            const p2 = parseFloat(document.getElementById('stats-dist-p2')?.value) || 1;

            const dists = window.MARS.Statistics.Distributions;
            let out = '';
            if (type === 'normal') {
                const pdf = dists.normalPDF(x, p1, p2);
                const cdf = dists.normalCDF(x, p1, p2);
                out = `Distribuição Normal N(μ = ${p1}, σ = ${p2}):\n` +
                      `• Densidade f(${x}): ${pdf.toFixed(5)}\n` +
                      `• Acumulada P(X ≤ ${x}): ${(cdf * 100).toFixed(3)}% (CDF = ${cdf.toFixed(5)})\n` +
                      `• P(X > ${x}): ${((1 - cdf) * 100).toFixed(3)}%`;
            } else if (type === 'binomial') {
                const n = Math.round(p1);
                const p = p2;
                const pmf = dists.binomialPMF(Math.round(x), n, p);
                const cdf = dists.binomialCDF(Math.round(x), n, p);
                out = `Distribuição Binomial B(n = ${n}, p = ${p}):\n` +
                      `• P(X = ${Math.round(x)}): ${(pmf * 100).toFixed(3)}% (PMF = ${pmf.toFixed(5)})\n` +
                      `• P(X ≤ ${Math.round(x)}): ${(cdf * 100).toFixed(3)}% (CDF = ${cdf.toFixed(5)})\n` +
                      `• Média E(X) = ${n * p} | Var(X) = ${(n * p * (1 - p)).toFixed(4)}`;
            } else if (type === 'poisson') {
                const lambda = p1;
                const pmf = dists.poissonPMF(Math.round(x), lambda);
                const cdf = dists.poissonCDF(Math.round(x), lambda);
                out = `Distribuição de Poisson Poisson(λ = ${lambda}):\n` +
                      `• P(X = ${Math.round(x)}): ${(pmf * 100).toFixed(3)}% (PMF = ${pmf.toFixed(5)})\n` +
                      `• P(X ≤ ${Math.round(x)}): ${(cdf * 100).toFixed(3)}% (CDF = ${cdf.toFixed(5)})\n` +
                      `• Média E(X) = ${lambda} | Var(X) = ${lambda}`;
            }
            previewEl.textContent = out;
        }
    }

    static writeToBoard() {
        const board = window.MARS_BOARD.instance;
        const previewEl = document.getElementById('stats-steps-preview');
        const text = previewEl?.textContent || '';
        if (!text) return;

        const cx = board.scrollContainer.scrollLeft + window.innerWidth / 2;
        const cy = board.scrollContainer.scrollTop + window.innerHeight / 2;

        this.close();
        window.MARS_BOARD.drawChalkTextOnBoard(board.mainCtx, text, cx - 360, cy - 100, {
            color: board.currentColor,
            size: 32,
            framed: true
        });
        board.saveState();
        window.MARS_UI.Toast.show('Análise estatística escrita na lousa', 'success');
    }

    static plotChartToBoard() {
        const board = window.MARS_BOARD.instance;
        const cx = board.scrollContainer.scrollLeft + window.innerWidth / 2;
        const cy = board.scrollContainer.scrollTop + window.innerHeight / 2;

        this.close();

        if (this.currentTab === 'descriptive') {
            const raw = document.getElementById('stats-raw-input')?.value.trim();
            const res = window.MARS.statistics.analyzeDataset(raw);
            if (res && res.stats) {
                // Plot Boxplot and Frequency Histogram
                window.MARS_BOARD.BoardPlotter.plotBoxplot(board.mainCtx, res.stats, cx, cy - 60);
                const table = window.MARS.Statistics.FrequencyTableAnalyzer.buildFromRawData(res.stats.sorted);
                if (table) {
                    window.MARS_BOARD.BoardPlotter.plotHistogram(board.mainCtx, table, cx, cy + 180);
                }
                board.saveState();
                window.MARS_UI.Toast.show('Boxplot e Histograma plotados na lousa!', 'success');
            }
        } else if (this.currentTab === 'regression') {
            const raw = document.getElementById('stats-reg-input')?.value.trim();
            const lines = (raw || '').split('\n').filter(Boolean);
            const points = [];
            lines.forEach(l => {
                const parts = l.split(/[,;\s]+/).filter(Boolean).map(Number);
                if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
                    points.push({ x: parts[0], y: parts[1] });
                }
            });
            const reg = window.MARS.Statistics.LinearRegression.fit(points);
            if (reg) {
                window.MARS_BOARD.BoardPlotter.plotScatter(board.mainCtx, points, reg, cx, cy);
                board.saveState();
                window.MARS_UI.Toast.show('Gráfico de Dispersão e Reta de Regressão plotados na lousa!', 'success');
            }
        } else {
            window.MARS_UI.Toast.show('Selecione Estatística Descritiva ou Regressão para plotar gráficos.', 'info');
        }
    }
}

window.MARS_UI.StatsLabUI = StatsLabUI;
