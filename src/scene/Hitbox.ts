import { Vector3, Matrix4, Quaternion, Box3, BufferGeometry, BufferAttribute } from "three";
import  GameObject from "../scene/GameObject";
import HelperCollision from "../globals/HelperCollision";
import Face from "./Face";

class Hitbox {

    private _gameObject:GameObject|null;
    private _boundsMin:Vector3;
    private _boundsMax:Vector3;
    private _matrixFromNode:Matrix4;
    private _name:string;
    private _meshvertices:Vector3[];
    private _meshnormals:Vector3[];
    private _meshfaces:Face[];

    constructor(
        matrixFromNode:Matrix4,
        geometry:BufferGeometry,
        name:string)
    {
        this._gameObject = null;
        this._boundsMax = geometry.boundingBox!.max.clone();
        this._boundsMin = geometry.boundingBox!.min.clone();
        this._matrixFromNode = matrixFromNode.clone();
        this._name = name;
        this._meshnormals = [];
        this._meshvertices = [];
        this._meshfaces = [];
        //this.box3 = null;
        /*
        this._meshCenter = meshCenter;
        this._minX = minX;
        this._minY = minY;
        this._minZ = minZ;
        this._maxX = maxX;
        this._maxY = maxY;
        this._maxZ = maxZ;
        this.nodePosition = nodePosition;
        this.nodeRotation = nodeRotation;
        this.nodeScale = nodeScale;
        this.staticvertices = [];
        this.staticnormals = [];
        this.baseTranslationMatrix = new Matrix4();
        //this.isFloor = isFloor;
        this.meshData = meshData;
        this.nodeName = nodeName;
        */
        this.init(geometry);

    }

    private init(geometry:BufferGeometry):void
    {
        // Finde einzigartige Vertices:
        const index:BufferAttribute = geometry.getIndex()!;
        for ( let i = 0; i < index.count; i += 9 ) 
        {
            let v1:Vector3 = new Vector3(
                geometry.attributes.position.getX(index.getX(i + 0)), 
                geometry.attributes.position.getX(index.getX(i + 1)), 
                geometry.attributes.position.getX(index.getX(i + 2)));

            let v2:Vector3 = new Vector3(
                geometry.attributes.position.getX(index.getX(i + 3)), 
                geometry.attributes.position.getX(index.getX(i + 4)), 
                geometry.attributes.position.getX(index.getX(i + 5)));

            let v3:Vector3 = new Vector3(
                geometry.attributes.position.getX(index.getX(i + 6)), 
                geometry.attributes.position.getX(index.getX(i + 7)), 
                geometry.attributes.position.getX(index.getX(i + 8)));

            let f:Face = new Face(v1, v2, v3);
            this._meshfaces.push(f);

            if(HelperCollision.checkIfInAttributeArray(this._meshvertices, v1) == false)
                this._meshvertices.push(v1);
            if(HelperCollision.checkIfInAttributeArray(this._meshvertices, v2) == false)
                this._meshvertices.push(v2);
            if(HelperCollision.checkIfInAttributeArray(this._meshvertices, v3) == false)
                this._meshvertices.push(v3);
        }
        console.log(1);
        console.log(this._meshvertices);

        // Finde einzigartige Normals:
        for ( let i = 0; i < this._meshfaces.length; i++ ) 
        {
            
            let n:Vector3 = this._meshfaces[i]._normal.clone();
            if(HelperCollision.checkIfInAttributeArray(this._meshnormals, n) == false)
            {
                this._meshnormals.push(n);
            }
        }
        console.log(this._meshnormals);
        console.log(this._meshfaces);

        /*
        if(this.meshData != null)
        {
            this.staticvertices = this.meshData.vertices;
            this.staticnormals = this.meshData.normals;
        }
        else
        {
            this.staticvertices.push(new Vector3(this.minX,this.minY,this.maxZ)); // links unten vorn
            this.staticvertices.push(new Vector3(this.maxX, this.minY, this.maxZ)); // rechts unten vorn
            this.staticvertices.push(new Vector3(this.maxX, this.minY, this.minZ)); // rechts unten hinten
            this.staticvertices.push(new Vector3(this.minX, this.minY, this.minZ)); // links unten hinten
            this.staticvertices.push(new Vector3(this.maxX, this.maxY, this.maxZ)); // rechts oben vorn
            this.staticvertices.push(new Vector3(this.minX, this.maxY, this.maxZ)); // links oben vorn
            this.staticvertices.push(new Vector3(this.minX, this.maxY, this.minZ)); // links oben hinten
            this.staticvertices.push(new Vector3(this.maxX, this.maxY, this.minZ)); // rechts oben hinten

            this.staticnormals.push(new Vector3(1,0,0));
            this.staticnormals.push(new Vector3(0,1,0));
            this.staticnormals.push(new Vector3(0,0,1));
        }
        
        this.staticcenter = this.meshCenter.clone();

        this._vertices = [];
        for(let i = 0; i < this.staticvertices.length; i++)
        {
            this._vertices.push(new Vector3(0,0,0));
        }

        this._normals = [];
        for(let i = 0; i < this.staticnormals.length; i++)
        {
            this._normals.push(new Vector3(0,0,0));
        }

        this._center = new Vector3(0,0,0);

        let q = new THREE.Quaternion(0,0,0,1);
        if(this.nodeRotation.isEuler)
        {
            q.setFromEuler(this.nodeRotation);
            this.nodeRotation = q.clone();
        }

        //this.baseRotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(this.nodeRotation);
        
        this.baseTranslationMatrix = this.createModelMatrix(
            this.nodePosition,
            this.nodeRotation,
            this.nodeScale
        );

        
        this.update();
        */
    }

    public setGameObject(g:GameObject):void
    {
        this._gameObject = g;
    }

    /*
    private update()
    {
        
        let left = 99999999.0;
        let right = -99999999.0;
        let bottom = 99999999.0;
        let top = -99999999.0;
        let back = 99999999.0;
        let front = -99999999.0;

        let q = new THREE.Quaternion(0,0,0,1);
        if(this.gameObject.object3d.rotation.isEuler)
        {
            q.setFromEuler(this.gameObject.object3d.rotation);
        }
        else
        {
            q.x = this.gameObject.object3d.rotation.x;
            q.y = this.gameObject.object3d.rotation.y;
            q.z = this.gameObject.object3d.rotation.z;
            q.w = this.gameObject.object3d.rotation.w;
        }

        let modelMatrix = this.createModelMatrix(
            this.gameObject.object3d.position, 
            q, 
            this.gameObject.object3d.scale
        );
        
        q = this.nodeRotation.clone().multiply(q);
        modelMatrix.premultiply(this.baseTranslationMatrix);
        
        for(let i = 0; i < this._vertices.length; i++)
        {
            if(i < this._normals.length)
            {
                var tmpNormal = this.staticnormals[i].clone();
                tmpNormal.applyQuaternion(q);
                this._normals[i] = tmpNormal;
            }

            var tmpVertex = this.staticvertices[i].clone();
            tmpVertex.applyMatrix4(modelMatrix);
            this._vertices[i] = tmpVertex;
            if(tmpVertex.x < left)
                left = tmpVertex.x;
            if(tmpVertex.x > right)
                right = tmpVertex.x;

            if(tmpVertex.y < bottom)
                bottom = tmpVertex.y;
            if(tmpVertex.y > top)
                top = tmpVertex.y;

            if(tmpVertex.z < back)
                back = tmpVertex.z;
            if(tmpVertex.z > front)
                front = tmpVertex.z;
        }       
        
        var tmpPosition = this.staticcenter.clone();
        tmpPosition.applyMatrix4(modelMatrix);
        this._center = tmpPosition;

        return [left,right,bottom,top,back,front,this._center.clone()];
        
    }

    static overlaps(min1, max1, min2, max2)
    {
        return Hitbox.isBetweenOrdered(min2, min1, max1) || Hitbox.isBetweenOrdered(min1, min2, max2);
    }

    static isBetweenOrdered(val, lowerBound, upperBound)
    {
        return lowerBound <= val && val <= upperBound;
    }

    createModelMatrix(position, rotation, scale)
    {
        let modelMatrix = new THREE.Matrix4().compose(position, rotation, scale);
        return modelMatrix;
    }

    static doCollisionTest(a, b)
    {
        let mtv = [new Vector3(0,0,0), new Vector3(0,0,0)];
        let mtvDirectionArray = [1.0];
        let mtvDistanceArray = [Number.POSITIVE_INFINITY];
        let mtvUpDirectionArray = [1.0];
        let mtvUpDistanceArray = [Number.POSITIVE_INFINITY];

        for(let i = 0; i < a._normals.length; i++)
        {
            let shape1MinMax = Hitbox.satTest(a._normals[i], a._vertices);
            let shape2MinMax = Hitbox.satTest(a._normals[i], b._vertices);
            if(!Hitbox.overlaps(shape1MinMax[0], shape1MinMax[1], shape2MinMax[0], shape2MinMax[1]))
            {
                return null;
            }
            else
            {
                Hitbox.calculateOverlap(
                    a._normals[i], 
                    shape1MinMax[0],
                    shape1MinMax[1],
                    shape2MinMax[0],
                    shape2MinMax[1],
                    mtvDistanceArray,
                    mtv,
                    mtvDirectionArray,
                    a._center,
                    b._center,
                    mtvUpDistanceArray,
                    mtvUpDirectionArray
                );
            }
        }
        for(let i = 0; i < b._normals.length; i++)
        {
            let shape1MinMax = Hitbox.satTest(b._normals[i], a._vertices);
            let shape2MinMax = Hitbox.satTest(b._normals[i], b._vertices);
            if(!Hitbox.overlaps(shape1MinMax[0], shape1MinMax[1], shape2MinMax[0], shape2MinMax[1]))
            {
                return null;
            }
            else
            {
                Hitbox.calculateOverlap(
                    b._normals[i], 
                    shape1MinMax[0],
                    shape1MinMax[1],
                    shape2MinMax[0],
                    shape2MinMax[1],
                    mtvDistanceArray,
                    mtv,
                    mtvDirectionArray,
                    a._center,
                    b._center,
                    mtvUpDistanceArray,
                    mtvUpDirectionArray
                );
            }
        }

        if(mtv[0].lengthSq() > 0)
        {
            return new Collision(b.gameObject, mtv, b.isFloor, b.nodeName);
        }
        else
        {
            return null;
        }
    }

    static satTest(axisToTest, points)
    {
        let minAlong = Number.POSITIVE_INFINITY;
        let maxAlong = Number.NEGATIVE_INFINITY;

        for(var i = 0; i < points.length; i++)
        {
            let tmp = points[i].clone();
            let dotVal = tmp.dot(axisToTest);
            if(dotVal < minAlong)
            {
                minAlong = dotVal;
            }
            if(dotVal > maxAlong)
            {
                maxAlong = dotVal;
            }
        }

        return [minAlong, maxAlong];
    }

    static calculateOverlap(axis, shape1Min, shape1Max, 
        shape2Min, shape2Max, 
        mtvDistance, // array
        mtv, // array with 2 elements (shortest and up)
        mtvDirection, //array
        posA,
        posB,
        mtvUpDistance, // array
        mtvUpDirection // array
        )
    {
        let intersectionDepthScaled = 1;
        if (shape1Min < shape2Min)
        {
            if (shape1Max > shape2Max)
            {
                let diff1 = shape1Max - shape2Max;
                let diff2 = shape2Min - shape1Min;
                if(diff1 > diff2)
                {
                    intersectionDepthScaled = shape2Max - shape1Min;
                }
                else
                {
                    intersectionDepthScaled = shape2Min - shape1Max;
                }
            }
            else
            {
                intersectionDepthScaled = shape1Max - shape2Min; // default
            }
        }
        else
        {
            if(shape1Max < shape2Max)
            {
                let diff1 = shape2Max - shape1Max;
                let diff2 = shape1Min - shape2Min;
                if (diff1 > diff2)
                {
                    intersectionDepthScaled = shape1Max - shape2Min;
                }
                else
                {
                    intersectionDepthScaled = shape1Min - shape2Max;
                }
            }
            else
            {
                intersectionDepthScaled = shape1Min - shape2Max; // default
            }
        }
        
        let axisLengthSquared = axis.dot(axis);
        let intersectionDepthSquared = (intersectionDepthScaled * intersectionDepthScaled) / axisLengthSquared;
        
        if(intersectionDepthSquared < mtvDistance[0])
        {
            mtvDistance[0] = intersectionDepthSquared;

            let tmpMtv = axis.clone();
            tmpMtv.multiplyScalar(intersectionDepthScaled / axisLengthSquared);
            let notSameDirection = new Vector3(0,0,0).subVectors(posA, posB).dot(tmpMtv);
            mtvDirection[0] = notSameDirection < 0 ? -1.0 : 1.0;
            if(this.meshData == null)
            {
                tmpMtv.multiplyScalar(mtvDirection[0]);
            }
            mtv[0] = tmpMtv.clone();
        }
        // find up-vector (for stairs)
        if(Math.abs(axis.y) > Math.abs(axis.x) && Math.abs(axis.y) > Math.abs(axis.z) && (intersectionDepthSquared < mtvUpDistance[0]))
        {
            let tmpMtv = axis.clone();
            tmpMtv.multiplyScalar(intersectionDepthScaled / axisLengthSquared);

            let tmpMtvUpDistance = intersectionDepthSquared;
            let notSameDirection = new Vector3(0,0,0).subVectors(posA, posB).dot(tmpMtv);
            let tmpMtvUpDirection = notSameDirection < 0 ? -1.0 : 1.0;
            if(this.meshData == null)
            {
                tmpMtv.multiplyScalar(tmpMtvUpDirection);
            }
            mtvUpDistance[0] = tmpMtvUpDistance;
            mtvUpDirection[0] = tmpMtvUpDirection;
            mtv[1] = tmpMtv.clone();
        }
    }

    public clearCollisionCandidates()
    {
        //TODO
    }
    */
}

export default Hitbox;