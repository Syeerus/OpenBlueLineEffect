/**
 * @file Geometry module.
 * @author Syeerus
 *
 * Copyright (C) 2021 Syeerus
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
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Marks a location on a Cartesian plane.
 */
export class Point {
    /**
     * X position.
     */
    public X: number;

    /**
     * Y position.
     */
    public Y: number;

    /**
     * @param x X position.
     * @param y Y position.
     */
    constructor(x: number = 0, y: number = 0) {
        this.X = x;
        this.Y = y;
    }
}

/**
 * Represents the size of an object on a Cartesian plane.
 */
export class Size {
    /**
     * Width of the object.
     */
    public Width: number;

    /**
     * Height of the object.
     */
    public Height: number;

    /**
     * @param width Width of the object.
     * @param height Height of the object.
     */
    constructor(width: number = 0, height: number = 0) {
        this.Width = width;
        this.Height = height;
    }
}

/**
 * Represents a bounding box.
 */
export class BoundingBox {
    /**
     * The top left corner.
     */
    public TopLeft: Point;

    /**
     * The top right corner.
     */
    public TopRight: Point;

    /**
     * The bottom left corner.
     */
    public BottomLeft: Point;

    /**
     * The bottom right corner.
     */
    public BottomRight: Point;

    /**
     * @param x The X position.
     * @param y The Y position.
     * @param width The width of the object..
     * @param height The height of the object.
     */
    constructor(x: number, y: number, width: number, height: number) {
        this.TopLeft = new Point(x, y);
        this.TopRight = new Point(x + width, y);
        this.BottomLeft = new Point(x, y + height);
        this.BottomRight = new Point(x + width, y + height);
    }
}

/**
 * Represents a rectangle.
 */
export class Rectangle {
    /**
     * The size of the rectangle.
     */
    public Size: Size;

    /**
     * The position of the rectangle.
     */
    public Position: Point;

    /**
     * Getter for X position.
     */
    public get X(): number {
        return this.Position.X;
    }

    /**
     * Setter for X position.
     */
    public set X(value: number) {
        this.Position.X = value;
    }

    /**
     * Getter for Y position.
     */
    public get Y(): number {
        return this.Position.Y;
    }

    /**
     * Setter for Y position.
     */
    public set Y(value: number) {
        this.Position.Y = value;
    }

    /**
     * Getter for width.
     */
    public get Width(): number {
        return this.Size.Width;
    }

    /**
     * Setter for width.
     */
    public set Width(value: number) {
        this.Size.Width = value;
    }

    /**
     * Getter for height.
     */
    public get Height(): number {
        return this.Size.Height;
    }

    /**
     * Setter for height.
     */
    public set Height(value: number) {
        this.Size.Height = value;
    }

    /**
     * @param x X position.
     * @param y Y position.
     * @param width Width of the rectangle.
     * @param height Height of the rectangle.
     */
    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.Position = new Point(x, y);
        this.Size = new Size(width, height);
    }

    /**
     * Returns the bounding box of the rectangle.
     */
    public GetBounds(): BoundingBox {
        return new BoundingBox(this.Position.X, this.Position.Y, this.Size.Width, this.Size.Height);
    }
}
