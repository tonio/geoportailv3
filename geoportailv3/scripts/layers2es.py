# -*- coding: utf-8 -*-

from pyramid.paster import bootstrap
import sys
import getopt
import json
import requests
from elasticsearch import helpers
from elasticsearch.helpers import BulkIndexError
from elasticsearch.exceptions import ConnectionTimeout
from geoportailv3.lib.search import get_elasticsearch, get_index, ensure_index

"""
Utility functions for importing layers metadata into Elasticsearch
"""


def update_document(index, type, obj_id, obj=None):
    doc = {
        "_index": index,
        "_type": type,
        "_id": obj_id,
    }
    doc['_source'] = {}
    doc['_source']['layer_id'] = obj_id
    doc['_source']['name'] = obj['name']
    doc['_source']['description'] = obj['description']
    doc['_source']['keywords'] = obj['keywords']
    return doc


def statuslog(text):
    sys.stdout.write(text)
    sys.stdout.flush()


def main():
    env = bootstrap('development.ini')
    from c2cgeoportal.models import DBSession, TreeItem
    request = env['request']
    try:
        opts, args = getopt.getopt(sys.argv[1:], 'ri', ['reset', 'index'])
    except getopt.GetoptError as err:
        print str(err)
        sys.exit(2)
    index, reset = False, False
    for o, a in opts:
        if o in ('-r', '--reset'):
            statuslog('\rResetting Index')
            reset = True
        if o in ('-i', '--index'):
            statuslog('\rChecking Index')
            index = True

    ensure_index(get_elasticsearch(request), get_index(request), reset)

    if index:
        layers = DBSession.query(TreeItem) \
                          .filter((TreeItem.item_type == 'l_wmts') | (TreeItem.item_type == 'lu_int_wms') | (TreeItem.item_type == 'lu_ext_wms')) \
                          .all()
        metadata_service_url = \
            'http://shop.geoportail.lu/Portail/inspire/webservices/getMD.jsp'
        doc_list = []
        for layer in layers:
            layerData = dict(
                name=layer.name,
                layer_id=layer.id,
                description='',
                keywords='',
                metadata_name=''
            )
            for metadata in layer.ui_metadata:
                if metadata.name == 'metadata_id':
                    params = dict(
                        uid=metadata.value,
                        lang='en'
                    )
                    resp = requests.get(url=metadata_service_url,
                                        params=params)
                    data = json.loads(resp.text)
                    layerData['keywords'] = data['root'][0]['keywords']
                    layerData['description'] = data['root'][0]['description']
                    layerData['metadata_name'] = data['root'][0]['name']
            doc = update_document(get_index(request),
                                  'layer',
                                  layerData['layer_id'],
                                  layerData)
            doc_list.append(doc)
        try:
            helpers.bulk(client=get_elasticsearch(request),
                         actions=doc_list,
                         chunk_size=500,
                         raise_on_error=True)
        except (BulkIndexError, ConnectionTimeout) as e:
            print "\n %s" % e

if __name__ == '__main__':
    main()
