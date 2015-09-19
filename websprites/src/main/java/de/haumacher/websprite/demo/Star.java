/*
 * TimeCollect records time you spent on your development work.
 * Copyright (C) 2015 Bernhard Haumacher and others
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package de.haumacher.websprite.demo;

import java.io.IOException;

import de.haumacher.websprite.Canvas;

public class Star {

	private double cx;
	private double cy;
	private double r;
	private int n;
	private Canvas canvas;

	public Star(Canvas canvas, double r, int n) {
		this.canvas = canvas;
		this.r = r;
		this.n = n;
	}

	public Star render() throws IOException {
		int s = 0;
		double a = angle(s);
		canvas.moveTo(x(a), y(a));
		for (int n = 0; n <= 11; n++, s+=4) {
			a = angle(s % 11);
			canvas.lineTo(x(a), y(a));
		}
		
		return this;
	}

	private double y(double a) {
		return cy + r * Math.sin(a);
	}

	private double x(double a) {
		return cx + r * Math.cos(a);
	}

	private double angle(int n) {
		return 2 * Math.PI / 11 * n;
	}

	public Star moveTo(double cx, double cy) {
		this.cx = cx;
		this.cy = cy;
		return this;
	}
}