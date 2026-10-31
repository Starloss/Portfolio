/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Home } from '@app/pages/Home';

import { renderWithProviders } from './render';

// Home: cubrir rama donde IntersectionObserver recibe entradas no intersecting
describe('Home IntersectionObserver no intersect', () => {
    beforeEach(() => {
        class MockIO {
            private _cb: any;
            constructor(cb: any) {
                this._cb = cb;
            }
            observe(el: any) {
                this._cb([{ target: el, isIntersecting: false }], this);
            }
            unobserve() {}
            disconnect() {}
            takeRecords() {
                return [];
            }
        }
        (window as any).IntersectionObserver = MockIO;
    });
    it('no marca ninguna sección mientras ninguna cruza la pantalla', () => {
        renderWithProviders(<Home />);
        expect(document.querySelector('[aria-current="page"]')).toBeNull();
    });
});
