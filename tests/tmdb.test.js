import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;

function mockFetch(response) {
  globalThis.fetch = async () => response;
}

function setBrowserOrigin(origin = 'http://localhost:8888') {
  globalThis.window = { location: { origin } };
}

async function loadApi() {
  return import('../src/api/tmdb.js');
}

describe('TMDb API helpers', () => {
  beforeEach(() => {
    setBrowserOrigin();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  });

  it('builds poster URLs for a valid path', async () => {
    const { img342, img780 } = await loadApi();
    assert.equal(img342('/abc.jpg'), 'https://image.tmdb.org/t/p/w342/abc.jpg');
    assert.equal(img780('/abc.jpg'), 'https://image.tmdb.org/t/p/w780/abc.jpg');
  });

  it('returns null when an image path is missing', async () => {
    const { img342, img780 } = await loadApi();
    assert.equal(img342(null), null);
    assert.equal(img780(''), null);
  });

  it('selects a YouTube trailer before another YouTube video', async () => {
    const { pickYouTubeTrailer } = await loadApi();
    const videos = {
      results: [
        { site: 'YouTube', type: 'Teaser', key: 'teaser' },
        { site: 'YouTube', type: 'Trailer', key: 'trailer' },
      ],
    };
    assert.equal(pickYouTubeTrailer(videos), 'trailer');
  });

  it('falls back to any YouTube video when no trailer exists', async () => {
    const { pickYouTubeTrailer } = await loadApi();
    assert.equal(
      pickYouTubeTrailer({ results: [{ site: 'Vimeo', type: 'Trailer', key: 'vimeo' }, { site: 'YouTube', type: 'Clip', key: 'clip' }] }),
      'clip'
    );
  });

  it('returns null when there are no videos', async () => {
    const { pickYouTubeTrailer } = await loadApi();
    assert.equal(pickYouTubeTrailer(), null);
    assert.equal(pickYouTubeTrailer({ results: [] }), null);
  });

  it('requests trending data through the Netlify API endpoint', async () => {
    let requestedUrl = '';
    globalThis.fetch = async (url) => {
      requestedUrl = String(url);
      return { ok: true, async json() { return { results: [{ id: 1 }] }; } };
    };

    const { getTrending } = await loadApi();
    const data = await getTrending('movie', 'week', 2);

    assert.deepEqual(data.results, [{ id: 1 }]);
    assert.match(requestedUrl, /\/api\/tmdb\?/);
    assert.match(requestedUrl, /path=%2Ftrending%2Fmovie%2Fweek/);
    assert.match(requestedUrl, /page=2/);
  });

  it('caches identical API requests for five minutes', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return { ok: true, async json() { return { results: [calls] }; } };
    };

    const { getMovieDetails } = await loadApi();
    const first = await getMovieDetails(123);
    const second = await getMovieDetails(123);

    assert.deepEqual(first, second);
    assert.equal(calls, 1);
  });

  it('maps common TMDb HTTP errors to user-friendly messages', async () => {
    mockFetch({ ok: false, status: 429 });
    const { getMovieDetails } = await loadApi();

    await assert.rejects(
      () => getMovieDetails(999),
      error => error instanceof Error && error.message.includes('TMDb is busy right now')
    );
  });

  it('handles network failures with a user-friendly message', async () => {
    globalThis.fetch = async () => {
      throw new Error('network down');
    };
    const { getMovieDetails } = await loadApi();

    await assert.rejects(
      () => getMovieDetails(456),
      error => error instanceof Error && error.message.includes('TMDb is taking a break right now')
    );
  });

  it('handles invalid JSON responses', async () => {
    mockFetch({ ok: true, async json() { throw new Error('invalid json'); } });
    const { getMovieDetails } = await loadApi();

    await assert.rejects(
      () => getMovieDetails(789),
      error => error instanceof Error && error.message.includes('unexpected response')
    );
  });
});
